import {
  Injectable,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  Unsubscribe,
} from 'firebase/firestore';

import {
  AuthService,
} from '../../../core/services/auth.service';

import {
  LoggerService,
} from '../../../core/services/logger.service';

import {
  CommunityUser,
} from '../models/community-user.model';

import {
  CommunityConversation,
} from '../models/community-conversation.model';

import {
  CommunityMessage,
} from '../models/community-message.model';

import {
  CommunityChatService,
} from '../services/community-chat.service';

import {
  CommunityMessageService,
} from '../services/community-message.service';

import {
  CommunityUserService,
} from '../services/community-user.service';

@Injectable({
  providedIn: 'root',
})
export class CommunityChatStore
  implements OnDestroy {

  // =============================================================
  // Dependencies
  // =============================================================

  private readonly authService =
    inject(AuthService);

  private readonly chatService =
    inject(CommunityChatService);

  private readonly messageService =
    inject(CommunityMessageService);

  private readonly userService =
    inject(CommunityUserService);

  private readonly logger =
    inject(LoggerService);


  // =============================================================
  // State
  // =============================================================

  readonly conversations =
    signal<CommunityConversation[]>([]);

  readonly messages =
    signal<CommunityMessage[]>([]);

  readonly selectedConversationId =
    signal<string | null>(null);

  readonly users =
    signal<Record<string, CommunityUser>>({});

  readonly loading =
    signal(false);

  readonly messagesLoading =
    signal(false);

  readonly sending =
    signal(false);

  readonly error =
    signal<string | null>(null);


  // =============================================================
  // Computed state
  // =============================================================

  readonly currentUserId =
    computed(
      () =>
        this.authService.user()?.id ??
        this.authService.firebaseUser()?.uid ??
        null,
    );


  readonly selectedConversation =
    computed(
      () => {

        const conversationId =
          this.selectedConversationId();

        if (!conversationId) {
          return null;
        }

        return (
          this.conversations()
            .find(
              (
                conversation,
              ) =>
                conversation.id ===
                conversationId,
            ) ?? null
        );
      },
    );


  readonly selectedParticipantId =
    computed(
      () => {

        const conversation =
          this.selectedConversation();

        const currentUserId =
          this.currentUserId();

        if (
          !conversation ||
          !currentUserId
        ) {
          return null;
        }

        return (
          conversation.participantIds
            .find(
              (
                participantId,
              ) =>
                participantId !==
                currentUserId,
            ) ?? null
        );
      },
    );


  readonly selectedParticipant =
    computed(
      () => {

        const participantId =
          this.selectedParticipantId();

        if (!participantId) {
          return null;
        }

        return (
          this.users()[participantId] ??
          null
        );
      },
    );


  readonly unreadMessageCount =
    computed(
      () => {

        const currentUserId =
          this.currentUserId();

        if (!currentUserId) {
          return 0;
        }

        return this.messages()
          .filter(
            (
              message,
            ) =>
              message.senderId !==
                currentUserId &&
              !message.readBy.includes(
                currentUserId,
              ),
          )
          .length;
      },
    );


  // =============================================================
  // Listeners
  // =============================================================

  private conversationsUnsubscribe:
    Unsubscribe | null = null;

  private messagesUnsubscribe:
    Unsubscribe | null = null;


  // =============================================================
  // Load conversations
  // =============================================================

  loadConversations(): void {

    const userId =
      this.currentUserId();

    if (!userId) {

      this.error.set(
        'You must be signed in to view your messages.',
      );

      return;
    }

    this.stopConversationListener();

    this.loading.set(true);
    this.error.set(null);

    this.conversationsUnsubscribe =
      this.chatService.listenToUserConversations(
        userId,

        (conversations) => {

          this.conversations.set(
            conversations,
          );

          this.loading.set(false);

          void this.hydrateUsers(
            conversations,
          );
        },

        (error) => {

          this.loading.set(false);

          this.error.set(
            'Unable to load your conversations.',
          );

          this.logger.error(
            'CommunityChatStore',
            'Failed to load community conversations.',
            {
              error:
                error.message,
            },
          );
        },
      );
  }


  // =============================================================
  // Start conversation
  // =============================================================

  async startConversation(
    otherUserId: string,
  ): Promise<CommunityConversation | null> {

    const currentUserId =
      this.currentUserId();

    if (!currentUserId) {

      this.error.set(
        'You must be signed in to send messages.',
      );

      return null;
    }

    if (
      !otherUserId ||
      otherUserId === currentUserId
    ) {

      this.error.set(
        'You cannot start a conversation with yourself.',
      );

      return null;
    }

    this.error.set(null);

    try {

      const conversation =
        await this.chatService.getOrCreateConversation(
          currentUserId,
          otherUserId,
        );

      this.selectedConversationId.set(
        conversation.id,
      );

      await this.hydrateUsers(
        [
          conversation,
        ],
      );

      this.listenToSelectedConversation();

      return conversation;

    } catch (error) {

      this.error.set(
        'Unable to start the conversation.',
      );

      this.logger.error(
        'CommunityChatStore',
        'Failed to start community conversation.',
        {
          otherUserId,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return null;
    }
  }


  // =============================================================
  // Select conversation
  // =============================================================

  async selectConversation(
    conversationId: string,
  ): Promise<void> {

    if (!conversationId) {
      return;
    }

    this.error.set(null);

    let conversation =
      this.conversations()
        .find(
          (
            item,
          ) =>
            item.id ===
            conversationId,
        ) ?? null;

    try {

      if (!conversation) {

        conversation =
          await this.chatService
            .getConversationById(
              conversationId,
            );
      }

      if (!conversation) {

        this.error.set(
          'Conversation could not be found.',
        );

        return;
      }

      const currentUserId =
        this.currentUserId();

      if (
        !currentUserId ||
        !conversation.participantIds.includes(
          currentUserId,
        )
      ) {

        this.error.set(
          'You do not have access to this conversation.',
        );

        return;
      }

      this.selectedConversationId.set(
        conversation.id,
      );

      await this.hydrateUsers(
        [
          conversation,
        ],
      );

      this.listenToSelectedConversation();

    } catch (error) {

      this.error.set(
        'Unable to open the conversation.',
      );

      this.logger.error(
        'CommunityChatStore',
        'Failed to open community conversation.',
        {
          conversationId,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );
    }
  }


  // =============================================================
  // Listen to selected conversation
  // =============================================================

  private listenToSelectedConversation(): void {

    const conversationId =
      this.selectedConversationId();

    if (!conversationId) {
      return;
    }

    this.stopMessageListener();

    this.messages.set([]);

    this.messagesLoading.set(
      true,
    );

    this.messagesUnsubscribe =
      this.messageService.listenToMessages(
        conversationId,

        (messages) => {

          this.messages.set(
            messages,
          );

          this.messagesLoading.set(
            false,
          );

          void this.markUnreadMessagesAsRead(
            messages,
          );
        },

        (error) => {

          this.messagesLoading.set(
            false,
          );

          this.error.set(
            'Unable to load messages.',
          );

          this.logger.error(
            'CommunityChatStore',
            'Failed to load community messages.',
            {
              conversationId,
              error:
                error.message,
            },
          );
        },
      );
  }


  // =============================================================
  // Send message
  // =============================================================

  async sendMessage(
    content: string,
  ): Promise<boolean> {

    const currentUserId =
      this.currentUserId();

    const conversationId =
      this.selectedConversationId();

    if (
      !currentUserId ||
      !conversationId
    ) {

      this.error.set(
        'Select a conversation before sending a message.',
      );

      return false;
    }

    const normalizedContent =
      content.trim();

    if (!normalizedContent) {
      return false;
    }

    this.sending.set(true);
    this.error.set(null);

    try {

      await this.messageService.createMessage(
        conversationId,
        currentUserId,
        normalizedContent,
      );

      this.logger.info(
        'CommunityChatStore',
        'Community message created.',
        {
          conversationId,
        },
      );

      return true;

    } catch (error) {

      this.error.set(
        error instanceof Error
          ? error.message
          : 'Unable to send the message.',
      );

      this.logger.error(
        'CommunityChatStore',
        'Failed to send community message.',
        {
          conversationId,
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );

      return false;

    } finally {

      this.sending.set(false);
    }
  }


  // =============================================================
  // Mark messages as read
  // =============================================================

  private async markUnreadMessagesAsRead(
    messages: CommunityMessage[],
  ): Promise<void> {

    const currentUserId =
      this.currentUserId();

    const conversationId =
      this.selectedConversationId();

    if (
      !currentUserId ||
      !conversationId
    ) {
      return;
    }

    const unreadMessages =
      messages.filter(
        (
          message,
        ) =>
          message.senderId !==
            currentUserId &&
          !message.readBy.includes(
            currentUserId,
          ),
      );

    if (
      unreadMessages.length === 0
    ) {
      return;
    }

    await Promise.all(
      unreadMessages.map(
        (
          message,
        ) =>
          this.messageService.markMessageAsRead(
            conversationId,
            message.id,
            currentUserId,
          ),
      ),
    );
  }


  // =============================================================
  // Hydrate users
  // =============================================================

  private async hydrateUsers(
    conversations: CommunityConversation[],
  ): Promise<void> {

    const currentUserId =
      this.currentUserId();

    const participantIds =
      [
        ...new Set(
          conversations.flatMap(
            (
              conversation,
            ) =>
              conversation.participantIds,
          ),
        ),
      ]
        .filter(
          (
            userId,
          ) =>
            userId !==
            currentUserId,
        );

    if (
      participantIds.length === 0
    ) {
      return;
    }

    try {

      const users =
        await this.userService.getUsersByIds(
          participantIds,
        );

      this.users.update(
        (
          existingUsers,
        ) => {

          const updatedUsers =
            {
              ...existingUsers,
            };

          for (
            const user of users
          ) {
            updatedUsers[user.id] =
              user;
          }

          return updatedUsers;
        },
      );

    } catch (error) {

      this.logger.error(
        'CommunityChatStore',
        'Failed to hydrate community conversation users.',
        {
          error:
            error instanceof Error
              ? error.message
              : String(error),
        },
      );
    }
  }


  // =============================================================
  // Clear selected conversation
  // =============================================================

  clearSelectedConversation(): void {

    this.stopMessageListener();

    this.selectedConversationId.set(
      null,
    );

    this.messages.set([]);
  }


  // =============================================================
  // Clear error
  // =============================================================

  clearError(): void {
    this.error.set(null);
  }


  // =============================================================
  // Stop conversation listener
  // =============================================================

  private stopConversationListener(): void {

    if (
      this.conversationsUnsubscribe
    ) {

      this.conversationsUnsubscribe();

      this.conversationsUnsubscribe =
        null;
    }
  }


  // =============================================================
  // Stop message listener
  // =============================================================

  private stopMessageListener(): void {

    if (
      this.messagesUnsubscribe
    ) {

      this.messagesUnsubscribe();

      this.messagesUnsubscribe =
        null;
    }
  }


  // =============================================================
  // Destroy
  // =============================================================

  ngOnDestroy(): void {

    this.stopConversationListener();

    this.stopMessageListener();
  }
}