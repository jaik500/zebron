import { computed, inject } from '@angular/core';

import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { Business } from '../models/business.model';

import { BusinessTransaction } from '../models/business-transaction.model';

import { BusinessActivity } from '../models/business-activity.model';

import { BusinessComplianceRequirement } from '../models/business-compliance.model';

import { BusinessDocument } from '../models/business-document.model';

import { BusinessService } from '../services/business.service';

import { Timestamp } from 'firebase/firestore';

// ============================================================

/**
 * Business Operations Signal Store state.
 */
interface BusinessState {
  businesses: Business[];

  selectedBusiness: Business | null;

  transactions: BusinessTransaction[];

  activities: BusinessActivity[];

  complianceItems: BusinessComplianceRequirement[];

  documents: BusinessDocument[];

  loading: boolean;

  saving: boolean;

  error: string | null;

  transactionSearch: string;

  transactionType: 'all' | 'revenue' | 'expense';

  complianceFilter: 'all' | 'current' | 'upcoming' | 'action_required' | 'overdue' | 'expired';
}

/**
 * Initial Business Operations state.
 */
const initialState: BusinessState = {
  businesses: [],

  selectedBusiness: null,

  transactions: [],

  activities: [],

  complianceItems: [],

  documents: [],

  loading: false,

  saving: false,

  error: null,

  transactionSearch: '',

  transactionType: 'all',

  complianceFilter: 'all',
};

/**
 * Business Operations Signal Store.
 */
export const BusinessStore = signalStore(
  {
    providedIn: 'root',
  },

  // ==========================================================
  // STATE
  // ==========================================================

  withState(initialState),

  // ==========================================================
  // COMPUTED STATE
  // ==========================================================

  withComputed(({ transactions, transactionSearch, transactionType, complianceItems }) => {
    /**
     * Total revenue.
     */
    const totalRevenue = computed(() =>
      transactions()
        .filter((transaction) => transaction.type === 'revenue' && transaction.status !== 'void')
        .reduce((total, transaction) => total + Number(transaction.amount), 0),
    );

    /**
     * Total expenses.
     */
    const totalExpenses = computed(() =>
      transactions()
        .filter((transaction) => transaction.type === 'expense' && transaction.status !== 'void')
        .reduce((total, transaction) => total + Number(transaction.amount), 0),
    );

    /**
     * Net income.
     */
    const netIncome = computed(() => totalRevenue() - totalExpenses());

    /**
     * Transaction count.
     */
    const transactionCount = computed(() => transactions().length);

    /**
     * Filtered transactions.
     */
    const filteredTransactions = computed(() => {
      const search = transactionSearch().trim().toLowerCase();

      const type = transactionType();

      return transactions().filter((transaction) => {
        if (type !== 'all' && transaction.type !== type) {
          return false;
        }

        if (!search) {
          return true;
        }

        const searchableText = [
          transaction.description,
          transaction.categoryId,
          transaction.vendorId,
          transaction.customerId,
          transaction.referenceNumber,
          transaction.paymentMethod,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(search);
      });
    });

    /**
     * Upcoming compliance.
     */
    const upcomingCompliance = computed(
      () => complianceItems().filter((item) => item.status === 'upcoming').length,
    );

    /**
     * Action-required compliance.
     */
    const actionRequiredCompliance = computed(
      () => complianceItems().filter((item) => item.status === 'action_required').length,
    );

    /**
     * Overdue compliance.
     */
    const overdueCompliance = computed(
      () => complianceItems().filter((item) => item.status === 'overdue').length,
    );

    return {
      totalRevenue,

      totalExpenses,

      netIncome,

      transactionCount,

      filteredTransactions,

      upcomingCompliance,

      actionRequiredCompliance,

      overdueCompliance,
    };
  }),

  // ==========================================================
  // METHODS
  // ==========================================================

  withMethods((store, businessService = inject(BusinessService)) => ({
    // ======================================================
    // LOAD EVERYTHING
    // ======================================================

    async loadBusinessData(): Promise<void> {
      patchState(store, {
        loading: true,
        error: null,
      });

      try {
        const [businesses, transactions, activities, complianceItems, documents] =
          await Promise.all([
            businessService.getBusinesses(),

            businessService.getTransactions(),

            businessService.getActivities(),

            businessService.getComplianceRequirements(),

            businessService.getDocuments(),
          ]);

        patchState(store, {
          businesses,

          selectedBusiness: businesses[0] ?? null,

          transactions,

          activities,

          complianceItems,

          documents,

          loading: false,
        });
      } catch (error) {
        console.error('Failed to load Business Operations data:', error);

        patchState(store, {
          loading: false,

          error: 'Unable to load Business Operations data.',
        });

        throw error;
      }
    },

    // ======================================================
    // TRANSACTION FILTERS
    // ======================================================

    setTransactionSearch(value: string): void {
      patchState(store, {
        transactionSearch: value,
      });
    },

    setTransactionType(value: 'all' | 'revenue' | 'expense'): void {
      patchState(store, {
        transactionType: value,
      });
    },

    // ======================================================
    // COMPLIANCE FILTER
    // ======================================================

    setComplianceFilter(
      value: 'all' | 'current' | 'upcoming' | 'action_required' | 'overdue' | 'expired',
    ): void {
      patchState(store, {
        complianceFilter: value,
      });
    },

    // ======================================================
    // SELECT BUSINESS
    // ======================================================

    selectBusiness(business: Business): void {
      patchState(store, {
        selectedBusiness: business,
      });
    },

    // Create a transaction
    createTransaction: async (
      transaction: Omit<BusinessTransaction, 'id' | 'createdAt' | 'updatedAt'>,
    ) => {
      patchState(store, {
        saving: true,
        error: null,
      });

      try {
        const id = await businessService.createTransaction(transaction);

        const createdTransaction: BusinessTransaction = {
          ...transaction,
          id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        patchState(store, {
          transactions: [createdTransaction, ...store.transactions()],
          saving: false,
        });

        return createdTransaction;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create transaction.';

        patchState(store, {
          saving: false,
          error: message,
        });

        throw error;
      }
    },

    // Update a transaction
    updateTransaction: async (id: string, changes: Partial<BusinessTransaction>) => {
      patchState(store, {
        saving: true,
        error: null,
      });

      try {
        await businessService.updateTransaction(id, changes);

        const updatedTransactions = store.transactions().map((transaction) =>
          transaction.id === id
            ? {
                ...transaction,
                ...changes,
                updatedAt: Timestamp.now(),
              }
            : transaction,
        );

        patchState(store, {
          transactions: updatedTransactions,
          saving: false,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update transaction.';

        patchState(store, {
          saving: false,
          error: message,
        });

        throw error;
      }
    },

    // Delete a transaction
    deleteTransaction: async (id: string) => {
      patchState(store, {
        saving: true,
        error: null,
      });

      try {
        await businessService.deleteTransaction(id);

        patchState(store, {
          transactions: store.transactions().filter((transaction) => transaction.id !== id),
          saving: false,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to delete transaction.';

        patchState(store, {
          saving: false,
          error: message,
        });

        throw error;
      }
    },

    // ======================================================
    // CREATE BUSINESS
    // ======================================================

    createBusiness: async (business: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>) => {
      patchState(store, {
        saving: true,
        error: null,
      });

      try {
        const id = await businessService.createBusiness(business);

        const createdBusiness: Business = {
          ...business,

          id,

          createdAt: Timestamp.now(),

          updatedAt: Timestamp.now(),
        };

        patchState(store, {
          businesses: [createdBusiness, ...store.businesses()],

          selectedBusiness: createdBusiness,

          saving: false,
        });

        return createdBusiness;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to create business.';

        patchState(store, {
          saving: false,
          error: message,
        });

        throw error;
      }
    },

    // ======================================================
    // UPDATE BUSINESS
    // ======================================================

    updateBusiness: async (id: string, changes: Partial<Business>) => {
      patchState(store, {
        saving: true,
        error: null,
      });

      try {
        await businessService.updateBusiness(id, changes);

        const updatedBusinesses = store.businesses().map((business) =>
          business.id === id
            ? {
                ...business,
                ...changes,
                updatedAt: Timestamp.now(),
              }
            : business,
        );

        const updatedBusiness = updatedBusinesses.find((business) => business.id === id) ?? null;

        patchState(store, {
          businesses: updatedBusinesses,

          selectedBusiness: updatedBusiness,

          saving: false,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to update business.';

        patchState(store, {
          saving: false,
          error: message,
        });

        throw error;
      }
    },

    createActivity: async (activity: Omit<BusinessActivity, 'id' | 'createdAt' | 'updatedAt'>) => {
      patchState(store, {
        saving: true,
        error: null,
      });

      try {
        const id = await businessService.createActivity(activity);

        const createdActivity: BusinessActivity = {
          ...activity,
          id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        patchState(store, {
          activities: [createdActivity, ...store.activities()],
          saving: false,
        });

        return createdActivity;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to create business activity.';

        patchState(store, {
          saving: false,
          error: message,
        });

        throw error;
      }
    },

    // Update a business activity
  updateActivity: async (
  id: string,
  changes: Partial<BusinessActivity>,
) => {

  patchState(store, {
    saving: true,
    error: null,
  });

  try {

    await businessService.updateActivity(
      id,
      changes,
    );

    const updatedActivities =
      store.activities().map(
        (activity) =>
          activity.id === id
            ? {
                ...activity,
                ...changes,
                updatedAt: Timestamp.now(),
              }
            : activity,
      );

    patchState(store, {
      activities: updatedActivities,
      saving: false,
    });

  } catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : 'Unable to update business activity.';

    patchState(store, {
      saving: false,
      error: message,
    });

    throw error;
  }
},

// Delete a business activity
deleteActivity: async (
  id: string,
) => {

  patchState(store, {
    saving: true,
    error: null,
  });

  try {

    await businessService.deleteActivity(
      id,
    );

    patchState(store, {
      activities:
        store.activities().filter(
          (activity) =>
            activity.id !== id,
        ),
      saving: false,
    });

  } catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : 'Unable to delete business activity.';

    patchState(store, {
      saving: false,
      error: message,
    });

    throw error;
  }
},

createComplianceRequirement: async (
  requirement: Omit<
    BusinessComplianceRequirement,
    'id' | 'createdAt' | 'updatedAt'
  >,
) => {

  patchState(store, {
    saving: true,
    error: null,
  });

  try {

    const id =
      await businessService
        .createComplianceRequirement(
          requirement,
        );

    const createdRequirement:
      BusinessComplianceRequirement = {
      ...requirement,
      id,
      createdAt:
        Timestamp.now(),
      updatedAt:
        Timestamp.now(),
    };

    patchState(store, {
      complianceItems: [
        createdRequirement,
        ...store.complianceItems(),
      ],
      saving: false,
    });

    return createdRequirement;

  } catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : 'Unable to create compliance requirement.';

    patchState(store, {
      saving: false,
      error: message,
    });

    throw error;
  }
},


updateComplianceRequirement: async (
  id: string,
  changes: Partial<
    BusinessComplianceRequirement
  >,
) => {

  patchState(store, {
    saving: true,
    error: null,
  });

  try {

    await businessService
      .updateComplianceRequirement(
        id,
        changes,
      );

    const updatedItems =
      store.complianceItems().map(
        (item) =>
          item.id === id
            ? {
                ...item,
                ...changes,
                updatedAt:
                  Timestamp.now(),
              }
            : item,
      );

    patchState(store, {
      complianceItems:
        updatedItems,
      saving: false,
    });

  } catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : 'Unable to update compliance requirement.';

    patchState(store, {
      saving: false,
      error: message,
    });

    throw error;
  }
},


deleteComplianceRequirement: async (
  id: string,
) => {

  patchState(store, {
    saving: true,
    error: null,
  });

  try {

    await businessService
      .deleteComplianceRequirement(
        id,
      );

    patchState(store, {
      complianceItems:
        store.complianceItems()
          .filter(
            (item) =>
              item.id !== id,
          ),
      saving: false,
    });

  } catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : 'Unable to delete compliance requirement.';

    patchState(store, {
      saving: false,
      error: message,
    });

    throw error;
  }
},

    /**
     * Refresh compliance statuses through BusinessService.
     *
     * The Store remains the state-management layer while
     * BusinessService remains the Firestore persistence layer.
     */
    refreshComplianceStatuses: async () => {
      patchState(store, {
        error: null,
      });

      try {
        const complianceItems =
          await businessService.refreshComplianceStatuses();

        patchState(store, {
          complianceItems,
          error: null,
        });
      }

      catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to refresh compliance statuses.';

        patchState(store, {
          error: message,
        });

        throw error;
      }
    },

    /////////////////////////////////////////////


  })),
);
