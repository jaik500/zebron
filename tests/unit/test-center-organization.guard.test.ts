
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Test Center organization guard unit tests.
 *
 * These tests avoid Angular TestBed and browser initialization.
 * The guard's dependencies are mocked so importing the guard
 * does not initialize the real NgRx OrganizationContextStore.
 */

const mocks = vi.hoisted(() => ({
  firebaseUser: null as { uid: string } | null,

  selectedOrganizationId: vi.fn<() => string | null>(),
  applicationsLoading: vi.fn<() => boolean>(),
  applicationsError: vi.fn<() => unknown>(),
  hasActiveApplication: vi.fn<(applicationId: string) => boolean>(),

  createUrlTree: vi.fn((commands: unknown[]) => ({
    commands,
  })),
}));

/**
 * Mock the organization context store module.
 *
 * This prevents the actual signalStore() declaration from running.
 */
vi.mock(
  '../../src/app/features/organizations/stores/organization-context.store',
  () => ({
    OrganizationContextStore: class OrganizationContextStore {},
  }),
);

/**
 * Mock the authentication service module.
 */
vi.mock('../../src/app/core/services/auth.service', () => ({
  AuthService: class AuthService {},
}));

/**
 * Mock Angular Router to avoid initializing its browser dependencies.
 */
vi.mock('@angular/router', () => ({
  Router: class Router {},
}));

/**
 * Mock inject() to supply the dependencies used by the guard.
 */
vi.mock('@angular/core', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@angular/core')>();

  return {
    ...actual,

    inject: (token: unknown) => {
      const tokenName = (token as { name?: string })?.name;

      if (tokenName === 'AuthService') {
        return {
          get firebaseUser() {
            return mocks.firebaseUser;
          },
        };
      }

      if (tokenName === 'OrganizationContextStore') {
        return {
          selectedOrganizationId: mocks.selectedOrganizationId,
          applicationsLoading: mocks.applicationsLoading,
          applicationsError: mocks.applicationsError,
          hasActiveApplication: mocks.hasActiveApplication,
        };
      }

      if (tokenName === 'Router') {
        return {
          createUrlTree: mocks.createUrlTree,
        };
      }

      throw new Error(
        `Unexpected injection token: ${tokenName}`,
      );
    },
  };
});

/**
 * Import after declaring mocks.
 */
import { testCenterOrganizationGuard } from
  '../../src/app/core/guards/test-center-organization.guard';

describe('testCenterOrganizationGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.firebaseUser = { uid: 'test-user-123' };

    mocks.selectedOrganizationId.mockReturnValue('org-test-123');
    mocks.applicationsLoading.mockReturnValue(false);
    mocks.applicationsError.mockReturnValue(null);
    mocks.hasActiveApplication.mockReturnValue(false);

    mocks.createUrlTree.mockImplementation(
      (commands: unknown[]) => ({ commands }),
    );
  });

  /**
   * Invoke the functional guard with mocked dependencies.
   */
  async function executeGuard(): Promise<unknown> {
    return await testCenterOrganizationGuard(
      {} as never,
      {} as never,
    );
  }

  it('redirects unauthenticated users to login', async () => {
    mocks.firebaseUser = null;

    const result = await executeGuard();

    expect(result).toEqual({
      commands: ['/login'],
    });

    expect(mocks.createUrlTree).toHaveBeenCalledWith([
      '/login',
    ]);

    expect(
      mocks.selectedOrganizationId,
    ).not.toHaveBeenCalled();
  });

  it('redirects users without a selected organization to /partner', async () => {
    mocks.selectedOrganizationId.mockReturnValue(null);

    const result = await executeGuard();

    expect(result).toEqual({
      commands: ['/partner'],
    });

    expect(mocks.createUrlTree).toHaveBeenCalledWith([
      '/partner',
    ]);
  });

  it('redirects to the organization dashboard while entitlements are loading', async () => {
    mocks.applicationsLoading.mockReturnValue(true);

    const result = await executeGuard();

    const expectedCommands = [
      '/partner/org',
      'org-test-123',
      'dashboard',
    ];

    expect(result).toEqual({
      commands: expectedCommands,
    });

    expect(mocks.createUrlTree).toHaveBeenCalledWith(
      expectedCommands,
    );

    expect(
      mocks.hasActiveApplication,
    ).not.toHaveBeenCalled();
  });

  it('fails closed when entitlement lookup returns an error', async () => {
    mocks.applicationsError.mockReturnValue(
      new Error('Failed to load organization applications'),
    );

    const result = await executeGuard();

    const expectedCommands = [
      '/partner/org',
      'org-test-123',
      'dashboard',
    ];

    expect(result).toEqual({
      commands: expectedCommands,
    });

    expect(mocks.createUrlTree).toHaveBeenCalledWith(
      expectedCommands,
    );

    expect(
      mocks.hasActiveApplication,
    ).not.toHaveBeenCalled();
  });

  it('redirects to the organization dashboard when Test Center is not active', async () => {
    mocks.hasActiveApplication.mockReturnValue(false);

    const result = await executeGuard();

    expect(
      mocks.hasActiveApplication,
    ).toHaveBeenCalledWith('test-center');

    expect(result).toEqual({
      commands: [
        '/partner/org',
        'org-test-123',
        'dashboard',
      ],
    });
  });

  it('redirects to organization-scoped Test Center when its entitlement is active', async () => {
    mocks.hasActiveApplication.mockReturnValue(true);

    const result = await executeGuard();

    expect(
      mocks.hasActiveApplication,
    ).toHaveBeenCalledWith('test-center');

    expect(result).toEqual({
      commands: [
        '/partner/org',
        'org-test-123',
        'test-center',
      ],
    });
  });

  it('uses the selected organization when building the destination route', async () => {
    mocks.selectedOrganizationId.mockReturnValue(
      'org-another-456',
    );

    mocks.hasActiveApplication.mockReturnValue(true);

    const result = await executeGuard();

    expect(result).toEqual({
      commands: [
        '/partner/org',
        'org-another-456',
        'test-center',
      ],
    });
  });
});

