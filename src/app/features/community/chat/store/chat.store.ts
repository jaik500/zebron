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

import type { Unsubscribe } from 'firebase/firestore';

import { AuthService } from '../../../../core/services/auth.service';
import { LoggerService } from '../../../../core/services/logger.service';

import {
  ChatConversation,
} from '../models/chat-conversation.model';

import {
  ChatAttachment,
  ChatMessage,
  ChatMessageType,
} from '../models/chat-message.model';

import {
  ChatParticipant,
} from '../models/chat-participant.model';

import {
  ChatService,
} from '../services/chat.service';


// ================================================================
// STATE
// ================================================================

interface ChatState {
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  messages: ChatMessage[];

  loading: boolean;
  messagesLoading: boolean;
  sending: boolean;
  uploading: boolean;
  uploadProgress: number;

  error: string | null;
  messagesError: string | null;
  activeConversationId: string | null;
}


// ================================================================
// INITIAL STATE
// ================================================================

const initialState: ChatState = {
  conversations: [],
  activeConversation: null,
  messages: [],

  loading: false,
  messagesLoading: false,
  sending: false,
  uploading: false,
  uploadProgress: 0,

  error: null,
  messagesError: null,
  activeConversationId: null,
};


// ================================================================
// STORE
// ================================================================

export const ChatStore = signalStore(
  {
    providedIn: 'root',
  },

  withState(initialState),

  withComputed((store) => {
    const authService = inject(AuthService);

    return {
      currentUser: computed(() => authService.user()),

      unreadMessageCount: computed(() => {
        const user = authService.user();

        if (!user) {
          return 0;
        }

        return store.messages().filter((message) => {
          if (message.senderId === user.id) {
            return false;
          }

          return !message.readBy.includes(user.id);
        }).length;
      }),

      hasActiveConversation: computed(
        () => !!store.activeConversation(),
      ),

      hasMessages: computed(
        () => store.messages().length > 0,
      ),

      isEmpty: computed(
        () =>
          !store.loading() &&
          store.conversations().length === 0,
      ),

      activeParticipants: computed(
        () => store.activeConversation()?.participantInfo ?? [],
      ),

      isBusy: computed(
        () => store.sending() || store.uploading(),
      ),
    };
  }),

  withMethods((store) => {
    const chatService = inject(ChatService);
    const authService = inject(AuthService);
    const logger = inject(LoggerService);

    let messageSubscription: Unsubscribe | null = null;

    function stopMessageSubscription(): void {
      if (messageSubscription) {
        messageSubscription();
        messageSubscription = null;
      }
    }

    function getErrorMessage(
      error: unknown,
      fallback: string,
    ): string {
      return error instanceof Error
        ? error.message
        : fallback;
    }

    function replaceConversation(
      conversation: ChatConversation,
    ): void {
      patchState(store, {
        conversations: store.conversations().some(
          (item) => item.id === conversation.id,
        )
          ? store.conversations().map((item) =>
              item.id === conversation.id
                ? conversation
                : item,
            )
          : [conversation, ...store.conversations()],
      });
    }

    function updateLocalUnreadCount(
      conversationId: string,
      userId: string,
      count: number,
    ): void {
      const update = (
        conversation: ChatConversation,
      ): ChatConversation => ({
        ...conversation,
        unreadCounts: {
          ...(conversation.unreadCounts ?? {}),
          [userId]: Math.max(0, count),
        },
      });

      patchState(store, {
        conversations: store.conversations().map((conversation) =>
          conversation.id === conversationId
            ? update(conversation)
            : conversation,
        ),
        activeConversation:
          store.activeConversation()?.id === conversationId
            ? update(store.activeConversation()!)
            : store.activeConversation(),
      });
    }

    return {
      // ============================================================
      // LOAD CONVERSATIONS
      // ============================================================

      async loadConversations(): Promise<void> {
        const user = authService.user();

        if (!user) {
          patchState(store, {
            conversations: [],
            loading: false,
            error: 'You must be signed in to view your conversations.',
          });
          return;
        }

        patchState(store, {
          loading: true,
          error: null,
        });

        try {
          const conversations =
            await chatService.getConversations(user.id);

          patchState(store, {
            conversations,
            loading: false,
            error: null,
          });

          logger.info(
            'ChatStore',
            'Community chat conversations loaded.',
            {
              userId: user.id,
              conversationCount: conversations.length,
            },
          );
        } catch (error) {
          const message = getErrorMessage(
            error,
            'Unable to load conversations.',
          );

          logger.error(
            'ChatStore',
            'Failed to load community chat conversations.',
            {
              userId: user.id,
              error: message,
            },
          );

          patchState(store, {
            conversations: [],
            loading: false,
            error: message,
          });
        }
      },


      // ============================================================
      // OPEN CONVERSATION
      // ============================================================

      // ============================================================
      // OPEN CONVERSATION
      // ============================================================

      openConversation: openConversationInternal,

      // ============================================================
      // MARK CONVERSATION AS READ
      // ============================================================

      async markConversationAsRead(
        conversationId: string,
      ): Promise<void> {
        const user = authService.user();
        const id = conversationId.trim();

        if (!user || !id) {
          return;
        }

        // Clear the UI immediately so the Messages menu updates instantly.
        updateLocalUnreadCount(id, user.id, 0);

        try {
          await chatService.markConversationAsRead(
            id,
            user.id,
          );

          logger.debug(
            'ChatStore',
            'Community chat conversation marked as read.',
            {
              conversationId: id,
              userId: user.id,
            },
          );
        } catch (error) {
          logger.error(
            'ChatStore',
            'Failed to mark community chat conversation as read.',
            {
              conversationId: id,
              userId: user.id,
              error: getErrorMessage(
                error,
                'Unable to mark conversation as read.',
              ),
            },
          );
        }
      },


      // ============================================================
      // START DIRECT CONVERSATION
      // ============================================================

      async startDirectConversation(
        otherUser: ChatParticipant,
      ): Promise<string | null> {
        const user = authService.user();

        if (!user) {
          patchState(store, {
            error: 'You must be signed in to start a conversation.',
          });
          return null;
        }

        const otherUserId = otherUser.userId.trim();

        if (!otherUserId) {
          patchState(store, {
            error: 'Other user ID is required.',
          });
          return null;
        }

        if (otherUserId === user.id) {
          patchState(store, {
            error: 'You cannot start a conversation with yourself.',
          });
          return null;
        }

        patchState(store, {
          error: null,
        });

        try {
          const currentUser: ChatParticipant = {
            userId: user.id,
            displayName:
              user.displayName ||
              'Zebron Community Member',
            ...(user.photoUrl
              ? { photoUrl: user.photoUrl }
              : {}),
          };

          const conversation =
            await chatService.createDirectConversation({
              currentUser,
              otherUser,
            });

          replaceConversation(conversation);
          await openConversationInternal(conversation.id);

          logger.info(
            'ChatStore',
            'Community direct conversation started.',
            {
              conversationId: conversation.id,
              otherUserId,
            },
          );

          return conversation.id;
        } catch (error) {
          const message = getErrorMessage(
            error,
            'Unable to start conversation.',
          );

          logger.error(
            'ChatStore',
            'Failed to start community direct conversation.',
            {
              otherUserId,
              error: message,
            },
          );

          patchState(store, {
            error: message,
          });

          return null;
        }
      },


      // ============================================================
      // SEND TEXT MESSAGE
      // ============================================================

      async sendMessage(
        content: string,
      ): Promise<string | null> {
        const user = authService.user();
        const conversation = store.activeConversation();
        const text = content.trim();

        if (!user) {
          patchState(store, {
            messagesError: 'You must be signed in to send a message.',
          });
          return null;
        }

        if (!conversation) {
          patchState(store, {
            messagesError: 'Open a conversation before sending a message.',
          });
          return null;
        }

        if (!text || store.sending() || store.uploading()) {
          return null;
        }

        patchState(store, {
          sending: true,
          messagesError: null,
        });

        try {
          const messageId = await chatService.sendMessage({
            conversationId: conversation.id,
            senderId: user.id,
            content: text,
            type: 'text',
            attachment: null,
          });

          patchState(store, {
            sending: false,
          });

          logger.info(
            'ChatStore',
            'Community chat text message sent.',
            {
              conversationId: conversation.id,
              messageId,
              senderId: user.id,
            },
          );

          return messageId;
        } catch (error) {
          const message = getErrorMessage(
            error,
            'Unable to send message.',
          );

          logger.error(
            'ChatStore',
            'Failed to send community chat text message.',
            {
              conversationId: conversation.id,
              senderId: user.id,
              error: message,
            },
          );

          patchState(store, {
            sending: false,
            messagesError: message,
          });

          return null;
        }
      },


      // ============================================================
      // SEND MESSAGE WITH ATTACHMENT
      // ============================================================

      async sendMessageWithAttachment(
        content: string,
        file: File,
      ): Promise<string | null> {
        const user = authService.user();
        const conversation = store.activeConversation();
        const text = content.trim();

        if (!user) {
          patchState(store, {
            messagesError: 'You must be signed in to send a message.',
          });
          return null;
        }

        if (!conversation || !file) {
          return null;
        }

        if (store.sending() || store.uploading()) {
          return null;
        }

        patchState(store, {
          uploading: true,
          uploadProgress: 0,
          messagesError: null,
        });

        try {
          const attachment =
            await chatService.uploadAttachment(
              conversation.id,
              file,
              (progress) => {
                patchState(store, {
                  uploadProgress: progress,
                });
              },
            );

          const type: ChatMessageType =
            getMessageType(file.type);

          const messageId =
            await chatService.sendMessage({
              conversationId: conversation.id,
              senderId: user.id,
              content: text,
              type,
              attachment,
            });

          patchState(store, {
            uploading: false,
            uploadProgress: 100,
          });

          logger.info(
            'ChatStore',
            'Community chat attachment message sent.',
            {
              conversationId: conversation.id,
              messageId,
              senderId: user.id,
              type,
              fileName: file.name,
              size: file.size,
            },
          );

          return messageId;
        } catch (error) {
          const message = getErrorMessage(
            error,
            'Unable to send attachment.',
          );

          logger.error(
            'ChatStore',
            'Failed to send community chat attachment message.',
            {
              conversationId: conversation.id,
              senderId: user.id,
              fileName: file.name,
              error: message,
            },
          );

          patchState(store, {
            uploading: false,
            uploadProgress: 0,
            messagesError: message,
          });

          return null;
        }
      },


      // ============================================================
      // SEND MULTIPLE ATTACHMENTS
      // ============================================================

      async sendAttachments(
        files: File[] | FileList,
        content = '',
      ): Promise<string[]> {
        const selectedFiles = Array.from(files);
        const sentMessageIds: string[] = [];

        for (const file of selectedFiles) {
          const messageId =
            await sendAttachmentMessage(
              content,
              file,
            );

          if (messageId) {
            sentMessageIds.push(messageId);
          }
        }

        return sentMessageIds;
      },


      // ============================================================
      // MARK MESSAGE AS READ
      // ============================================================

      async markMessageAsRead(
        messageOrConversationId: ChatMessage | string,
        messageId?: string,
      ): Promise<void> {
        const user = authService.user();

        if (!user) {
          return;
        }

        let message: ChatMessage | undefined;

        if (typeof messageOrConversationId === 'string') {
          message = store.messages().find(
            (item) =>
              item.id === messageId &&
              item.conversationId === messageOrConversationId,
          );
        } else {
          message = messageOrConversationId;
        }

        if (!message) {
          return;
        }

        if (message.senderId === user.id) {
          return;
        }

        if (message.readBy.includes(user.id)) {
          return;
        }

        try {
          await chatService.markMessageAsRead(
            message.conversationId,
            message.id,
            user.id,
          );

          patchState(store, {
            messages: store.messages().map((item) =>
              item.id === message!.id
                ? {
                    ...item,
                    status: 'read',
                    readBy: item.readBy.includes(user.id)
                      ? item.readBy
                      : [...item.readBy, user.id],
                  }
                : item,
            ),
          });
        } catch (error) {
          logger.error(
            'ChatStore',
            'Failed to mark community chat message as read.',
            {
              conversationId: message.conversationId,
              messageId: message.id,
              userId: user.id,
              error: getErrorMessage(
                error,
                'Unable to mark message as read.',
              ),
            },
          );
        }
      },


      // ============================================================
      // MARK MESSAGE AS READ BY ID
      // ============================================================

      async markMessageAsReadById(
        conversationId: string,
        messageId: string,
      ): Promise<void> {
        await markMessageAsReadInternal(
          conversationId,
          messageId,
        );
      },


      // ============================================================
      // CLOSE CONVERSATION
      // ============================================================

      closeConversation(): void {
        stopMessageSubscription();

        patchState(store, {
          activeConversationId: null,
          activeConversation: null,
          messages: [],
          messagesLoading: false,
          messagesError: null,
          sending: false,
          uploading: false,
          uploadProgress: 0,
        });
      },


      // ============================================================
      // CLEAR
      // ============================================================

      clear(): void {
        stopMessageSubscription();
        patchState(store, initialState);
      },


      // ============================================================
      // DESTROY
      // ============================================================

      destroy(): void {
        stopMessageSubscription();
        patchState(store, initialState);
      },


      // ============================================================
      // STOP MESSAGE SUBSCRIPTION
      // ============================================================

      stopMessageSubscription,
    };

    async function sendAttachmentMessage(
      content: string,
      file: File,
    ): Promise<string | null> {
      const user = authService.user();
      const conversation = store.activeConversation();
      const text = content.trim();

      if (!user || !conversation || !file) {
        return null;
      }

      if (store.sending() || store.uploading()) {
        return null;
      }

      patchState(store, {
        uploading: true,
        uploadProgress: 0,
        messagesError: null,
      });

      try {
        const attachment = await chatService.uploadAttachment(
          conversation.id,
          file,
          (progress) => {
            patchState(store, { uploadProgress: progress });
          },
        );

        const type = getMessageType(file.type);
        const messageId = await chatService.sendMessage({
          conversationId: conversation.id,
          senderId: user.id,
          content: text,
          type,
          attachment,
        });

        patchState(store, {
          uploading: false,
          uploadProgress: 100,
        });

        logger.info(
          'ChatStore',
          'Community chat attachment message sent.',
          {
            conversationId: conversation.id,
            messageId,
            senderId: user.id,
            type,
            fileName: file.name,
            size: file.size,
          },
        );

        return messageId;
      } catch (error) {
        const message = getErrorMessage(
          error,
          'Unable to send attachment.',
        );

        logger.error(
          'ChatStore',
          'Failed to send community chat attachment message.',
          {
            conversationId: conversation.id,
            senderId: user.id,
            fileName: file.name,
            error: message,
          },
        );

        patchState(store, {
          uploading: false,
          uploadProgress: 0,
          messagesError: message,
        });

        return null;
      }
    }


async function openConversationInternal(
    conversationId: string,
  ): Promise<void> {
    const id = conversationId.trim();

    if (!id) {
      patchState(store, {
        error: 'Conversation ID is required.',
      });
      return;
    }

    stopMessageSubscription();

    patchState(store, {
      activeConversationId: id,
      activeConversation: null,
      messages: [],
      messagesLoading: true,
      messagesError: null,
      error: null,
    });

    try {
      const conversation =
        await chatService.getConversation(id);

      if (!conversation) {
        patchState(store, {
          activeConversationId: null,
          activeConversation: null,
          messages: [],
          messagesLoading: false,
          messagesError: 'Conversation could not be found.',
        });
        return;
      }

      patchState(store, {
        activeConversation: conversation,
      });

      // Opening a conversation means the notification has been seen.
      await chatService.markConversationAsRead(
        id,
        authService.user()?.id ?? '',
      );

      const userId = authService.user()?.id;

      if (userId) {
        updateLocalUnreadCount(id, userId, 0);
      }

      messageSubscription = chatService.subscribeToMessages(
        id,
        (messages) => {
          patchState(store, {
            messages,
            messagesLoading: false,
            messagesError: null,
          });
        },
        (error) => {
          logger.error(
            'ChatStore',
            'Community chat message listener failed.',
            {
              conversationId: id,
              error: error.message,
            },
          );

          patchState(store, {
            messagesLoading: false,
            messagesError: error.message,
          });
        },
      );

      logger.info(
        'ChatStore',
        'Community chat conversation opened.',
        {
          conversationId: id,
        },
      );
    } catch (error) {
      const message = getErrorMessage(
        error,
        'Unable to open conversation.',
      );

      logger.error(
        'ChatStore',
        'Failed to open community chat conversation.',
        {
          conversationId: id,
          error: message,
        },
      );

      patchState(store, {
        activeConversationId: null,
        activeConversation: null,
        messages: [],
        messagesLoading: false,
        messagesError: message,
      });
    }
  }

    async function markMessageAsReadInternal(
      messageOrConversationId: ChatMessage | string,
      messageId?: string,
    ): Promise<void> {
      const user = authService.user();

      if (!user) {
        return;
      }

      const message =
        typeof messageOrConversationId === 'string'
          ? store.messages().find(
              (item) =>
                item.id === messageId &&
                item.conversationId === messageOrConversationId,
            )
          : messageOrConversationId;

      if (!message || message.senderId === user.id) {
        return;
      }

      if (message.readBy.includes(user.id)) {
        return;
      }

      try {
        await chatService.markMessageAsRead(
          message.conversationId,
          message.id,
          user.id,
        );

        patchState(store, {
          messages: store.messages().map((item) =>
            item.id === message!.id
              ? {
                  ...item,
                  status: 'read',
                  readBy: item.readBy.includes(user.id)
                    ? item.readBy
                    : [...item.readBy, user.id],
                }
              : item,
          ),
        });
      } catch (error) {
        logger.error(
          'ChatStore',
          'Failed to mark community chat message as read.',
          {
            conversationId: message.conversationId,
            messageId: message.id,
            userId: user.id,
            error: getErrorMessage(
              error,
              'Unable to mark message as read.',
            ),
          },
        );
      }
    }


    function getMessageType(
      contentType: string,
    ): ChatMessageType {
      const normalized = contentType.toLowerCase();

      if (normalized.startsWith('image/')) {
        return 'image';
      }

      if (normalized.startsWith('video/')) {
        return 'video';
      }

      if (normalized.startsWith('audio/')) {
        return 'audio';
      }

      return 'file';
    }
  }),
);
