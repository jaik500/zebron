import { describe, expect, it } from 'vitest';

import {
  resolveOrganizationLifecycleStatus,
  resolveOrganizationLifecycleTransition,
} from '../../functions/src/organization-lifecycle-policy';

describe('Organization lifecycle policy', () => {
  describe('resolveOrganizationLifecycleStatus', () => {
    it('defaults to active when status and legacy active are absent', () => {
      expect(resolveOrganizationLifecycleStatus(undefined, undefined))
        .toBe('active');
    });

    it('preserves an explicit active status', () => {
      expect(resolveOrganizationLifecycleStatus('active', true))
        .toBe('active');
    });

    it('resolves legacy active=false to suspended', () => {
      expect(resolveOrganizationLifecycleStatus(undefined, false))
        .toBe('suspended');
    });

    it('preserves a valid suspended status', () => {
      expect(resolveOrganizationLifecycleStatus('suspended', true))
        .toBe('suspended');
    });

    it('rejects an invalid explicit status', () => {
      expect(() =>
        resolveOrganizationLifecycleStatus('invalid-status', true),
      ).toThrow();
    });
  });

  describe('suspend', () => {
    it('suspends an active organization', () => {
      expect(
        resolveOrganizationLifecycleTransition('suspend', {
          status: 'active',
        }),
      ).toEqual({
        previousStatus: 'active',
        status: 'suspended',
      });
    });

    it('suspends an organization in onboarding', () => {
      expect(
        resolveOrganizationLifecycleTransition('suspend', {
          status: 'onboarding',
        }),
      ).toEqual({
        previousStatus: 'onboarding',
        status: 'suspended',
      });
    });

    it('rejects suspending an already suspended organization', () => {
      expect(() =>
        resolveOrganizationLifecycleTransition('suspend', {
          status: 'suspended',
        }),
      ).toThrow();
    });

    it('rejects suspending an archived organization', () => {
      expect(() =>
        resolveOrganizationLifecycleTransition('suspend', {
          status: 'archived',
        }),
      ).toThrow();
    });
  });

  describe('reactivate', () => {
    it('reactivates to the previous active status', () => {
      expect(
        resolveOrganizationLifecycleTransition('reactivate', {
          status: 'suspended',
          previousStatus: 'active',
        }),
      ).toEqual({
        previousStatus: 'suspended',
        status: 'active',
      });
    });

    it('restores the onboarding status after suspension', () => {
      expect(
        resolveOrganizationLifecycleTransition('reactivate', {
          status: 'suspended',
          previousStatus: 'onboarding',
        }),
      ).toEqual({
        previousStatus: 'suspended',
        status: 'onboarding',
      });
    });

    it('defaults to active when previousStatus is absent', () => {
      expect(
        resolveOrganizationLifecycleTransition('reactivate', {
          status: 'suspended',
        }),
      ).toEqual({
        previousStatus: 'suspended',
        status: 'active',
      });
    });

    it('rejects reactivating an active organization', () => {
      expect(() =>
        resolveOrganizationLifecycleTransition('reactivate', {
          status: 'active',
        }),
      ).toThrow();
    });
  });

  describe('archive', () => {
    it('archives an active organization', () => {
      expect(
        resolveOrganizationLifecycleTransition('archive', {
          status: 'active',
        }),
      ).toEqual({
        previousStatus: 'active',
        status: 'archived',
      });
    });

    it('archives an organization in onboarding', () => {
      expect(
        resolveOrganizationLifecycleTransition('archive', {
          status: 'onboarding',
        }),
      ).toEqual({
        previousStatus: 'onboarding',
        status: 'archived',
      });
    });

    it('rejects archiving a suspended organization', () => {
      expect(() =>
        resolveOrganizationLifecycleTransition('archive', {
          status: 'suspended',
        }),
      ).toThrow();
    });

    it('rejects archiving an already archived organization', () => {
      expect(() =>
        resolveOrganizationLifecycleTransition('archive', {
          status: 'archived',
        }),
      ).toThrow();
    });
  });

  describe('restore', () => {
    it('restores an archived organization to its previous active status', () => {
      expect(
        resolveOrganizationLifecycleTransition('restore', {
          status: 'archived',
          preArchiveStatus: 'active',
        }),
      ).toEqual({
        previousStatus: 'archived',
        status: 'active',
      });
    });

    it('restores an archived organization to onboarding', () => {
      expect(
        resolveOrganizationLifecycleTransition('restore', {
          status: 'archived',
          preArchiveStatus: 'onboarding',
        }),
      ).toEqual({
        previousStatus: 'archived',
        status: 'onboarding',
      });
    });

    it('defaults to active when preArchiveStatus is absent', () => {
      expect(
        resolveOrganizationLifecycleTransition('restore', {
          status: 'archived',
        }),
      ).toEqual({
        previousStatus: 'archived',
        status: 'active',
      });
    });

    it('rejects restoring an organization that is not archived', () => {
      expect(() =>
        resolveOrganizationLifecycleTransition('restore', {
          status: 'active',
        }),
      ).toThrow();
    });
  });
});