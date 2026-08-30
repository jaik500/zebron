import {
  computed,
  inject,
} from '@angular/core';

import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';

import {
  ContactMessage,
  ContactMessageStatus,
} from '../../../core/models/contact-message.model';

import {
  ContactReply,
  ContactService,
  NewContactMessage,
} from '../../../core/services/contact.service';

import { ContactMessageService } from '../../../core/services/contact-message.service';


// ============================================================
// STATE
// ============================================================

interface ContactState {
  messages: ContactMessage[];

  selectedMessage: ContactMessage | null;

  loading: boolean;

  error: string | null;
}


const initialState: ContactState = {
  messages: [],

  selectedMessage: null,

  loading: false,

  error: null,
};


// ============================================================
// CONTACT STORE
// ============================================================

export const ContactStore = signalStore(

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

  withComputed(
    ({
      messages,
    }) => ({

      unreadCount: computed(() =>
        messages().filter(
          (message) =>
            message.status === 'unread',
        ).length,
      ),

      readCount: computed(() =>
        messages().filter(
          (message) =>
            message.status === 'read',
        ).length,
      ),

      archivedCount: computed(() =>
        messages().filter(
          (message) =>
            message.status === 'archived',
        ).length,
      ),

      resultCount: computed(
        () =>
          messages().length,
      ),

    }),
  ),


  // ==========================================================
  // METHODS
  // ==========================================================

  withMethods(
    (
      store,

      contactMessageService =
        inject(ContactMessageService),

      contactService =
        inject(ContactService),

    ) => {

      // --------------------------------------------------------
      // Realtime listener cleanup
      // --------------------------------------------------------

      let unsubscribeMessages:
        (() => void) | null = null;


      // --------------------------------------------------------
      // Normalize messages
      // --------------------------------------------------------

      const normalizeMessages = (
        messages: ContactMessage[],
      ): ContactMessage[] => {

        return messages.map(
          (message): ContactMessage => {

            /*
             * Keep the current ContactMessage status
             * as the canonical status.
             *
             * The current model supports:
             *
             * unread
             * read
             * archived
             */
            const status: ContactMessageStatus =
              message.status;


            return {
              ...message,

              status,
            };

          },
        );

      };


      return {


        // ======================================================
        // START REALTIME LISTENER
        // ======================================================

        startMessageListener(): void {

          unsubscribeMessages?.();


          patchState(
            store,
            {
              loading: true,

              error: null,
            },
          );


          unsubscribeMessages =
            contactMessageService
              .listenToContactMessages(

                (messages) => {

                  const normalizedMessages =
                    normalizeMessages(
                      messages,
                    );


                  patchState(
                    store,
                    {
                      messages:
                        normalizedMessages,

                      loading: false,

                      error: null,
                    },
                  );

                },


                (error) => {

                  console.error(
                    'Contact mailbox listener failed:',
                    error,
                  );


                  patchState(
                    store,
                    {
                      loading: false,

                      error:
                        'Unable to load contact messages. Please try again.',
                    },
                  );

                },

              );

        },


        // ======================================================
        // STOP REALTIME LISTENER
        // ======================================================

        stopMessageListener(): void {

          unsubscribeMessages?.();

          unsubscribeMessages = null;

        },


        // ======================================================
        // LOAD MESSAGES
        // ======================================================

        async loadMessages(): Promise<void> {

          patchState(
            store,
            {
              loading: true,

              error: null,
            },
          );


          try {

            const messages =
              await contactMessageService
                .getAllContactMessages();


            const normalizedMessages =
              normalizeMessages(
                messages,
              );


            patchState(
              store,
              {
                messages:
                  normalizedMessages,

                loading: false,

                error: null,
              },
            );

          } catch (error) {

            console.error(
              'Failed to load contact messages:',
              error,
            );


            patchState(
              store,
              {
                loading: false,

                error:
                  'Unable to load contact messages. Please try again.',
              },
            );

          }

        },


        // ======================================================
        // GET MESSAGE
        // ======================================================

        async getMessage(
          messageId: string,
        ): Promise<ContactMessage | null> {

          try {

            const message =
              await contactMessageService
                .getContactMessageById(
                  messageId,
                );


            patchState(
              store,
              {
                selectedMessage:
                  message,
              },
            );


            return message;

          } catch (error) {

            console.error(
              'Failed to get contact message:',
              error,
            );

            throw error;

          }

        },


        // ======================================================
        // SET SELECTED MESSAGE
        // ======================================================

        setSelectedMessage(
          message: ContactMessage | null,
        ): void {

          patchState(
            store,
            {
              selectedMessage:
                message,
            },
          );

        },


        // ======================================================
        // CLEAR SELECTED MESSAGE
        // ======================================================

        clearSelectedMessage(): void {

          patchState(
            store,
            {
              selectedMessage: null,
            },
          );

        },


        // ======================================================
        // UPDATE LOCAL STATUS
        // ======================================================

        updateLocalStatus(
          messageId: string,

          status: ContactMessageStatus,
        ): void {

          patchState(
            store,
            {
              messages:
                store.messages().map(
                  (message) =>
                    message.id === messageId
                      ? {
                          ...message,

                          status,
                        }
                      : message,
                ),

              selectedMessage:
                store.selectedMessage()?.id ===
                messageId
                  ? {
                      ...store.selectedMessage()!,

                      status,
                    }
                  : store.selectedMessage(),
            },
          );

        },


        // ======================================================
        // MARK AS READ
        // ======================================================

        async markAsRead(
          messageId: string,
        ): Promise<void> {

          await contactMessageService
            .markAsRead(
              messageId,
            );


          this.updateLocalStatus(
            messageId,
            'read',
          );

        },


        // ======================================================
        // ARCHIVE
        // ======================================================

        async archiveMessage(
          messageId: string,
        ): Promise<void> {

          await contactMessageService
            .archiveMessage(
              messageId,
            );


          this.updateLocalStatus(
            messageId,
            'archived',
          );

        },


        // ======================================================
        // UNARCHIVE
        // ======================================================

        async unarchiveMessage(
          messageId: string,
        ): Promise<void> {

          await contactMessageService
            .unarchiveMessage(
              messageId,
            );


          this.updateLocalStatus(
            messageId,
            'read',
          );

        },


        // ======================================================
        // DELETE
        // ======================================================

        async deleteMessage(
          messageId: string,
        ): Promise<void> {

          await contactMessageService
            .deleteMessage(
              messageId,
            );


          patchState(
            store,
            {
              messages:
                store.messages().filter(
                  (message) =>
                    message.id !== messageId,
                ),

              selectedMessage:
                store.selectedMessage()?.id ===
                messageId
                  ? null
                  : store.selectedMessage(),
            },
          );

        },


        // ======================================================
        // SEND REPLY
        // ======================================================

        async sendReply(
          reply: ContactReply,
        ): Promise<void> {

          await contactService
            .sendReply(
              reply,
            );

        },


        // ======================================================
        // SEND NEW MESSAGE
        // ======================================================

        async sendNewMessage(
          message: NewContactMessage,
        ): Promise<void> {

          await contactService
            .sendNewMessage(
              message,
            );

        },


        // ======================================================
        // DESTROY STORE LISTENER
        // ======================================================

        destroyContactStore(): void {

          unsubscribeMessages?.();

          unsubscribeMessages = null;

        },

      };

    },
  ),

);