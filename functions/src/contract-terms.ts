/**
 * Default Zebron Partner Agreement.
 *
 * Used until a platform administrator saves their own version
 * (contractTerms/current). Sections are plain text; the partner page
 * and the PDF render them as headed paragraphs.
 *
 * IMPORTANT: this is a starting template, not legal advice. Have it
 * reviewed by a lawyer before relying on it with real partners.
 */

export interface ContractTermsSection {
  heading: string;
  body: string;
}

export interface ContractTerms {
  version: string;
  title: string;
  sections: ContractTermsSection[];
}

export const DEFAULT_NOTICE_PERIOD_DAYS = 30;

export const DEFAULT_CONTRACT_TERMS: ContractTerms = {
  version: "2026-10-v1",
  title: "Zebron Partner Agreement",
  sections: [
    {
      heading: "1. Parties and purpose",
      body:
        "This agreement is between Zebron (\"Zebron\", \"we\") and the partner " +
        "organization named in this contract (\"Partner\", \"you\"). It sets out " +
        "how the Partner may use the Zebron platform and the applications " +
        "provisioned for it, such as Community, Test Center and Knowledge Center.",
    },
    {
      heading: "2. Term",
      body:
        "The agreement starts on the effective date shown in this contract and " +
        "continues until either party ends it as described in section 9. " +
        "There is no fixed end date.",
    },
    {
      heading: "3. Provisioned applications",
      body:
        "Zebron provides the applications listed as provisioned in this contract. " +
        "The Partner may request additional applications, or the suspension, " +
        "resumption or retirement of an application, through the Contract & " +
        "Billing page. Changes take effect when Zebron approves and completes them.",
    },
    {
      heading: "4. Partner responsibilities",
      body:
        "The Partner is responsible for the people it invites, the roles it " +
        "assigns, the content it publishes, and keeping sign-in details secure. " +
        "The Partner will use the platform lawfully and will not use it to send " +
        "unsolicited or misleading messages.",
    },
    {
      heading: "5. Data and privacy",
      body:
        "The Partner owns the content and member data it adds to the platform. " +
        "Zebron processes that data only to provide the service, keeps it " +
        "separate from other organizations, and protects it with reasonable " +
        "security measures. The Partner may request an export of its data at any time.",
    },
    {
      heading: "6. Fees and billing",
      body:
        "Fees, if any, are set out in a separate order or invoice agreed with " +
        "Zebron. The billing contact named in this contract receives billing " +
        "communications. Unless agreed otherwise in writing, no fees are due " +
        "under this agreement.",
    },
    {
      heading: "7. Service availability and support",
      body:
        "Zebron works to keep the platform available and secure, but does not " +
        "guarantee uninterrupted service. Planned maintenance is announced in " +
        "advance where possible. Support requests can be made through the " +
        "Contract & Billing page or by email.",
    },
    {
      heading: "8. Suspension",
      body:
        "Zebron may suspend an application or the Partner's access if required " +
        "by law, to protect the platform or other users, or for a serious breach " +
        "of this agreement that is not fixed after notice. Zebron will explain " +
        "the reason and restore access once the issue is resolved.",
    },
    {
      heading: "9. Termination",
      body:
        "The Partner's owner may end this agreement at any time from the " +
        "Contract & Billing page by giving notice. Access continues during the " +
        "notice period shown in this contract and ends when it expires. The " +
        "owner may cancel the termination before then. Zebron may end the " +
        "agreement with the same notice, or immediately for a serious breach.",
    },
    {
      heading: "10. After termination",
      body:
        "When the agreement ends, the Partner's organization is suspended. " +
        "Zebron keeps the Partner's data for 90 days so it can be exported on " +
        "request, then deletes or anonymizes it unless the law requires otherwise.",
    },
    {
      heading: "11. Liability",
      body:
        "To the extent allowed by law, neither party is liable for indirect or " +
        "consequential losses. Nothing in this agreement limits liability that " +
        "cannot be limited by law.",
    },
    {
      heading: "12. Changes to this agreement",
      body:
        "Zebron may update these terms. The Partner's owner is asked to accept " +
        "a new version in the Contract & Billing page. Until then, the version " +
        "previously accepted continues to apply.",
    },
  ],
};
