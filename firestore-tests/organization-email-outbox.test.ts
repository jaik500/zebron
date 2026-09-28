import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  deleteApp,
  getApps,
  initializeApp,
} from "../functions/node_modules/firebase-admin/lib/app";

import {
  getFirestore,
  Timestamp,
} from "../functions/node_modules/firebase-admin/lib/firestore";

import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

import fs from "node:fs";

import {
  processOrganizationEmailOutbox,
  sendOrganizationEmailOutbox,
} from "../functions/src/organization-email-outbox";

/* -------------------------------------------------------------------------- */
/* Test configuration                                                         */
/* -------------------------------------------------------------------------- */

const PROJECT_ID = "zebron-test";

const FIRESTORE_EMULATOR_HOST =
  "127.0.0.1:8080";

const OUTBOX_COLLECTION =
  "organizationEmailOutbox";

const NOW =
  new Date("2026-09-28T12:00:00.000Z");

const ORGANIZATION_ID =
  "org-001";

const INVITATION_ID =
  "inv-001";

const OUTBOX_ID =
  "outbox-001";

const RECIPIENT_EMAIL =
  "member@example.com";

const ORGANIZATION_NAME =
  "Test Organization";

const ROLE =
  "org_member";

const SUBJECT =
  "You're invited to join Test Organization on Zebron";

const ACCEPTANCE_URL =
  "https://zebron.org/organization/invitations/accept" +
  "?invitationId=inv-001";

const ORIGINAL_FETCH =
  globalThis.fetch;

const ORIGINAL_RESEND_API_KEY =
  process.env["RESEND_API_KEY"];

/* -------------------------------------------------------------------------- */
/* Test environment                                                           */
/* -------------------------------------------------------------------------- */

let testEnv:
  | RulesTestEnvironment
  | undefined;

let adminDb:
  ReturnType<typeof getFirestore>;

/* -------------------------------------------------------------------------- */
/* Lifecycle                                                                  */
/* -------------------------------------------------------------------------- */

beforeAll(async () => {
  process.env[
    "FIRESTORE_EMULATOR_HOST"
  ] = FIRESTORE_EMULATOR_HOST;

  process.env[
    "RESEND_API_KEY"
  ] = "test-resend-api-key";

  const rulesPath =
    "firestore.rules";

  expect(
    fs.existsSync(rulesPath),
  ).toBe(true);

  testEnv =
    await initializeTestEnvironment({
      projectId:
        PROJECT_ID,

      firestore: {
        host:
          "127.0.0.1",

        port:
          8080,

        rules:
          fs.readFileSync(
            rulesPath,
            "utf8",
          ),
      },
    });

  if (
    getApps().length === 0
  ) {
    initializeApp({
      projectId:
        PROJECT_ID,
    });
  }

  adminDb =
    getFirestore();
});

afterEach(async () => {
  globalThis.fetch =
    ORIGINAL_FETCH;

  process.env[
    "RESEND_API_KEY"
  ] = "test-resend-api-key";

  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

afterAll(async () => {
  globalThis.fetch =
    ORIGINAL_FETCH;

  if (
    ORIGINAL_RESEND_API_KEY ===
    undefined
  ) {
    delete process.env[
      "RESEND_API_KEY"
    ];
  } else {
    process.env[
      "RESEND_API_KEY"
    ] =
      ORIGINAL_RESEND_API_KEY;
  }

  if (testEnv) {
    await testEnv.cleanup();
  }

  for (
    const app of getApps()
  ) {
    await deleteApp(app);
  }
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function createResendSuccessResponse(
  resendEmailId =
    "resend-test-001",
) {
  return {
    ok: true,

    status: 200,

    json: async () => ({
      id:
        resendEmailId,
    }),
  };
}

function createResendFailureResponse(
  status = 500,
  message =
    "Internal server error",
) {
  return {
    ok: false,

    status,

    json: async () => ({
      message,
    }),
  };
}

function mockSuccessfulResend(
  resendEmailId =
    "resend-test-001",
) {
  globalThis.fetch =
    vi.fn().mockResolvedValue(
      createResendSuccessResponse(
        resendEmailId,
      ),
    );
}

function mockFailedResend(
  status = 500,
  message =
    "Internal server error",
) {
  globalThis.fetch =
    vi.fn().mockResolvedValue(
      createResendFailureResponse(
        status,
        message,
      ),
    );
}

async function seedOutbox(
  id = OUTBOX_ID,
  overrides: Record<
    string,
    unknown
  > = {},
) {
  const now =
    NOW;

  await adminDb
    .collection(
      OUTBOX_COLLECTION,
    )
    .doc(id)
    .set({
      type:
        "organization_invitation",

      invitationId:
        INVITATION_ID,

      organizationId:
        ORGANIZATION_ID,

      organizationName:
        ORGANIZATION_NAME,

      recipientEmail:
        RECIPIENT_EMAIL,

      role:
        ROLE,

      subject:
        SUBJECT,

      text:
        [
          "You have been invited to join an organization on Zebron.",
          "",
          `Organization: ${ORGANIZATION_NAME}`,
          `Role: ${ROLE}`,
          "",
          "Accept your invitation:",
          ACCEPTANCE_URL,
        ].join("\n"),

      html:
        `<p>You have been invited to join an organization on Zebron.</p>` +
        `<p><strong>Organization:</strong> ${ORGANIZATION_NAME}</p>` +
        `<p><strong>Role:</strong> ${ROLE}</p>` +
        `<p><a href="${ACCEPTANCE_URL}">Accept your invitation</a></p>`,

      status:
        "pending",

      attemptCount:
        0,

      createdAt:
        now,

      updatedAt:
        now,

      sentAt:
        null,

      lastAttemptAt:
        null,

      nextAttemptAt:
        now,

      lastError:
        null,

      ...overrides,
    });
}

async function getOutbox(
  id = OUTBOX_ID,
) {
  return adminDb
    .collection(
      OUTBOX_COLLECTION,
    )
    .doc(id)
    .get();
}

/* -------------------------------------------------------------------------- */
/* Successful delivery                                                        */
/* -------------------------------------------------------------------------- */

describe(
  "sendOrganizationEmailOutbox",
  () => {
    beforeEach(() => {
      process.env[
        "RESEND_API_KEY"
      ] =
        "test-resend-api-key";
    });

    it(
      "sends an email through Resend",
      async () => {
        await seedOutbox();

        mockSuccessfulResend();

        const snapshot =
          await getOutbox();

        expect(
          snapshot.exists,
        ).toBe(true);

        const outbox =
          snapshot.data();

        await sendOrganizationEmailOutbox(
          {
            ...outbox,
            id:
              OUTBOX_ID,
          },
          NOW,
        );

        expect(
          globalThis.fetch,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "sends the expected Resend request",
      async () => {
        await seedOutbox();

        mockSuccessfulResend(
          "resend-payload-001",
        );

        const snapshot =
          await getOutbox();

        await sendOrganizationEmailOutbox(
          {
            ...snapshot.data(),
            id:
              OUTBOX_ID,
          },
          NOW,
        );

        const fetchMock =
          vi.mocked(
            globalThis.fetch,
          );

        expect(
          fetchMock,
        ).toHaveBeenCalledTimes(
          1,
        );

        const [
          url,
          options,
        ] =
          fetchMock.mock.calls[0];

        expect(url).toBe(
          "https://api.resend.com/emails",
        );

        expect(
          options,
        ).toMatchObject({
          method:
            "POST",

          headers: {
            Authorization:
              "Bearer test-resend-api-key",

            "Content-Type":
              "application/json",
          },
        });

        const body =
          JSON.parse(
            String(
              options?.body,
            ),
          );

        expect(body).toMatchObject({
          from:
            "Zebron <noreply@zebron.org>",

          to: [
            RECIPIENT_EMAIL,
          ],

          subject:
            SUBJECT,
        });

        expect(
          body.text,
        ).toContain(
          ORGANIZATION_NAME,
        );

        expect(
          body.text,
        ).toContain(
          ACCEPTANCE_URL,
        );

        expect(
          body.html,
        ).toContain(
          ACCEPTANCE_URL,
        );
      },
    );

    it(
      "marks the outbox record as sent",
      async () => {
        await seedOutbox();

        mockSuccessfulResend(
          "resend-success-001",
        );

        const snapshot =
          await getOutbox();

        await sendOrganizationEmailOutbox(
          {
            ...snapshot.data(),
            id:
              OUTBOX_ID,
          },
          NOW,
        );

        const updated =
          await getOutbox();

        const data =
          updated.data();

        expect(
          data?.status,
        ).toBe("sent");

        expect(
          data?.sentAt,
        ).toEqual(
          Timestamp.fromDate(
            NOW,
          ),
        );

        expect(
          data?.lastAttemptAt,
        ).toEqual(
          Timestamp.fromDate(
            NOW,
          ),
        );

        expect(
          data?.updatedAt,
        ).toEqual(
          Timestamp.fromDate(
            NOW,
          ),
        );
      },
    );

    it(
      "stores the Resend email ID",
      async () => {
        await seedOutbox();

        mockSuccessfulResend(
          "resend-id-123",
        );

        const snapshot =
          await getOutbox();

        await sendOrganizationEmailOutbox(
          {
            ...snapshot.data(),
            id:
              OUTBOX_ID,
          },
          NOW,
        );

        const updated =
          await getOutbox();

        expect(
          updated.data()
            ?.resendEmailId,
        ).toBe(
          "resend-id-123",
        );
      },
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Worker                                                                     */
/* -------------------------------------------------------------------------- */

describe(
  "processOrganizationEmailOutbox",
  () => {
    it(
      "processes a pending outbox record",
      async () => {
        await seedOutbox();

        mockSuccessfulResend();

        const result =
          await processOrganizationEmailOutbox(
            NOW,
          );

        expect(
          result.processed,
        ).toBe(1);

        const snapshot =
          await getOutbox();

        expect(
          snapshot.data()
            ?.status,
        ).toBe("sent");
      },
    );

    it(
      "increments attemptCount before sending",
      async () => {
        await seedOutbox();

        mockSuccessfulResend();

        await processOrganizationEmailOutbox(
          NOW,
        );

        const snapshot =
          await getOutbox();

        expect(
          snapshot.data()
            ?.attemptCount,
        ).toBe(1);
      },
    );

    it(
      "records lastAttemptAt",
      async () => {
        await seedOutbox();

        mockSuccessfulResend();

        await processOrganizationEmailOutbox(
          NOW,
        );

        const snapshot =
          await getOutbox();

        expect(
          snapshot.data()
            ?.lastAttemptAt,
        ).toEqual(
          Timestamp.fromDate(
            NOW,
          ),
        );
      },
    );

    it(
      "keeps a failed email pending when retries remain",
      async () => {
        await seedOutbox();

        mockFailedResend(
          500,
          "Temporary failure",
        );

        const result =
          await processOrganizationEmailOutbox(
            NOW,
          );

        expect(
          result.processed,
        ).toBe(1);

        const snapshot =
          await getOutbox();

        const data =
          snapshot.data();

        expect(
          data?.status,
        ).toBe("pending");

        expect(
          data?.attemptCount,
        ).toBe(1);

        expect(
          data?.lastError,
        ).toBe(
          "Resend returned HTTP 500: " +
          JSON.stringify({
            message:
              "Temporary failure",
          }),
        );

        expect(
          data?.nextAttemptAt,
        ).toEqual(
          Timestamp.fromDate(
            new Date(
              NOW.getTime() +
              60 * 1000,
            ),
          ),
        );
      },
    );

    it(
      "schedules the second retry for five minutes",
      async () => {
        await seedOutbox(
          OUTBOX_ID,
          {
            attemptCount:
              1,
          },
        );

        mockFailedResend();

        await processOrganizationEmailOutbox(
          NOW,
        );

        const snapshot =
          await getOutbox();

        expect(
          snapshot.data()
            ?.attemptCount,
        ).toBe(2);

        expect(
          snapshot.data()
            ?.nextAttemptAt,
        ).toEqual(
          Timestamp.fromDate(
            new Date(
              NOW.getTime() +
              5 * 60 * 1000,
            ),
          ),
        );
      },
    );

    it(
      "schedules the third retry for fifteen minutes",
      async () => {
        await seedOutbox(
          OUTBOX_ID,
          {
            attemptCount:
              2,
          },
        );

        mockFailedResend();

        await processOrganizationEmailOutbox(
          NOW,
        );

        const snapshot =
          await getOutbox();

        expect(
          snapshot.data()
            ?.attemptCount,
        ).toBe(3);

        expect(
          snapshot.data()
            ?.nextAttemptAt,
        ).toEqual(
          Timestamp.fromDate(
            new Date(
              NOW.getTime() +
              15 * 60 * 1000,
            ),
          ),
        );
      },
    );

    it(
      "schedules the fourth retry for one hour",
      async () => {
        await seedOutbox(
          OUTBOX_ID,
          {
            attemptCount:
              3,
          },
        );

        mockFailedResend();

        await processOrganizationEmailOutbox(
          NOW,
        );

        const snapshot =
          await getOutbox();

        expect(
          snapshot.data()
            ?.attemptCount,
        ).toBe(4);

        expect(
          snapshot.data()
            ?.nextAttemptAt,
        ).toEqual(
          Timestamp.fromDate(
            new Date(
              NOW.getTime() +
              60 * 60 * 1000,
            ),
          ),
        );
      },
    );

    it(
      "marks the fifth failed attempt as failed",
      async () => {
        await seedOutbox(
          OUTBOX_ID,
          {
            attemptCount:
              4,
          },
        );

        mockFailedResend(
          503,
          "Service unavailable",
        );

        await processOrganizationEmailOutbox(
          NOW,
        );

        const snapshot =
          await getOutbox();

        const data =
          snapshot.data();

        expect(
          data?.status,
        ).toBe("failed");

        expect(
          data?.attemptCount,
        ).toBe(5);

        expect(
          data?.lastError,
        ).toContain(
          "503",
        );

        expect(
          data?.nextAttemptAt,
        ).toEqual(
          Timestamp.fromDate(
            NOW,
          ),
        );
      },
    );

    it(
      "does not process an already sent record",
      async () => {
        await seedOutbox(
          OUTBOX_ID,
          {
            status:
              "sent",

            sentAt:
              NOW,
          },
        );

        mockSuccessfulResend();

        const result =
          await processOrganizationEmailOutbox(
            NOW,
          );

        expect(
          result.processed,
        ).toBe(0);

        expect(
          globalThis.fetch,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "does not process a pending record scheduled for the future",
      async () => {
        const future =
          new Date(
            NOW.getTime() +
            10 * 60 * 1000,
          );

        await seedOutbox(
          OUTBOX_ID,
          {
            nextAttemptAt:
              future,
          },
        );

        mockSuccessfulResend();

        const result =
          await processOrganizationEmailOutbox(
            NOW,
          );

        expect(
          result.processed,
        ).toBe(0);

        expect(
          globalThis.fetch,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "processes a pending record whose next attempt is due",
      async () => {
        const due =
          new Date(
            NOW.getTime() -
            1000,
          );

        await seedOutbox(
          OUTBOX_ID,
          {
            nextAttemptAt:
              due,
          },
        );

        mockSuccessfulResend();

        const result =
          await processOrganizationEmailOutbox(
            NOW,
          );

        expect(
          result.processed,
        ).toBe(1);

        expect(
          globalThis.fetch,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "processes multiple pending records",
      async () => {
        await seedOutbox(
          "outbox-001",
        );

        await seedOutbox(
          "outbox-002",
          {
            invitationId:
              "inv-002",
          },
        );

        await seedOutbox(
          "outbox-003",
          {
            invitationId:
              "inv-003",
          },
        );

        mockSuccessfulResend();

        const result =
          await processOrganizationEmailOutbox(
            NOW,
          );

        expect(
          result.processed,
        ).toBe(3);

        expect(
          globalThis.fetch,
        ).toHaveBeenCalledTimes(
          3,
        );
      },
    );
  },
);

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

describe(
  "sendOrganizationEmailOutbox validation",
  () => {
    it(
      "rejects when RESEND_API_KEY is missing",
      async () => {
        delete process.env[
          "RESEND_API_KEY"
        ];

        await expect(
          sendOrganizationEmailOutbox(
            {
              id:
                OUTBOX_ID,

              recipientEmail:
                RECIPIENT_EMAIL,

              subject:
                SUBJECT,

              text:
                "Test email",
            },
            NOW,
          ),
        ).rejects.toThrow(
          "RESEND_API_KEY is not configured.",
        );
      },
    );

    it(
      "rejects an outbox item without recipientEmail",
      async () => {
        await expect(
          sendOrganizationEmailOutbox(
            {
              id:
                OUTBOX_ID,

              subject:
                SUBJECT,

              text:
                "Test email",
            },
            NOW,
          ),
        ).rejects.toThrow(
          "Outbox item is missing recipientEmail.",
        );
      },
    );

    it(
      "rejects an outbox item without subject",
      async () => {
        await expect(
          sendOrganizationEmailOutbox(
            {
              id:
                OUTBOX_ID,

              recipientEmail:
                RECIPIENT_EMAIL,

              text:
                "Test email",
            },
            NOW,
          ),
        ).rejects.toThrow(
          "Outbox item is missing subject.",
        );
      },
    );

    it(
      "rejects an outbox item without text",
      async () => {
        await expect(
          sendOrganizationEmailOutbox(
            {
              id:
                OUTBOX_ID,

              recipientEmail:
                RECIPIENT_EMAIL,

              subject:
                SUBJECT,
            },
            NOW,
          ),
        ).rejects.toThrow(
          "Outbox item is missing text.",
        );
      },
    );
  },
);