import {
  Injectable,
  inject,
} from '@angular/core';

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';

import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
  type StorageReference,
  type UploadTask,
} from 'firebase/storage';

import {
  firestore,
} from '../../../../core/services/firebase-config';

import {
  ChatConversation,
  ChatConversationType,
} from '../models/chat-conversation.model';

import {
  ChatAttachment,
  ChatMessage,
  ChatMessageStatus,
  ChatMessageType,
  SendChatMessageInput,
} from '../models/chat-message.model';

import {
  ChatParticipant,
} from '../models/chat-participant.model';

import {
  LoggerService,
} from '../../../../core/services/logger.service';


// ================================================================
// CREATE DIRECT CONVERSATION INPUT
// ================================================================

export interface CreateDirectConversationInput {
  currentUser: ChatParticipant;

  otherUser: ChatParticipant;
}


// ================================================================
// CHAT SERVICE
// ================================================================

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly logger =
    inject(LoggerService);

  private readonly storage =
    getStorage();

  private readonly db = getFirestore();

  private readonly conversationPageSize =
    50;

  private readonly messagePageSize =
    100;

  private readonly maxMessageLength =
    5000;

  /**
   * Maximum attachment size.
   *
   * 50 MB keeps normal chat media practical while
   * preventing accidentally massive browser uploads.
   */
  private readonly maxAttachmentSize =
    50 * 1024 * 1024;


  // ==============================================================
  // CONVERSATIONS COLLECTION
  // ==============================================================

  private conversationsCollection() {
    return collection(
      firestore,
      'communityConversations',
    );
  }


  // ==============================================================
  // CONVERSATION DOCUMENT
  // ==============================================================

  private conversationDocument(
    conversationId: string,
  ) {
    return doc(
      firestore,
      'communityConversations',
      conversationId,
    );
  }


  // ==============================================================
  // MESSAGES COLLECTION
  // ==============================================================

  private messagesCollection(
    conversationId: string,
  ) {
    return collection(
      firestore,
      'communityConversations',
      conversationId,
      'messages',
    );
  }


  // ==============================================================
  // MESSAGE DOCUMENT
  // ==============================================================

  private messageDocument(
    conversationId: string,
    messageId: string,
  ) {
    return doc(
      firestore,
      'communityConversations',
      conversationId,
      'messages',
      messageId,
    );
  }


  // ==============================================================
  // STORAGE PATH
  // ==============================================================

  private attachmentStorageReference(
    conversationId: string,
    file: File,
  ): StorageReference {
    const safeConversationId =
      conversationId.trim();

    /*
     * Do not trust the original filename as a complete
     * Storage path.
     *
     * The generated identifier makes the path unique.
     */
    const uniqueId =
      this.generateUniqueId();

    const safeFileName =
      this.sanitizeFileName(
        file.name,
      );

    const path =
      [
        'communityChat',
        safeConversationId,
        'attachments',
        `${uniqueId}-${safeFileName}`,
      ].join('/');

    return ref(
      this.storage,
      path,
    );
  }


  // ==============================================================
  // GET CONVERSATIONS FOR USER
  // ==============================================================

  async getConversations(
    userId: string,
  ): Promise<ChatConversation[]> {
    const id =
      userId.trim();

    if (!id) {
      throw new Error(
        'User ID is required.',
      );
    }

    const conversationsQuery =
      query(
        this.conversationsCollection(),

        where(
          'participantIds',
          'array-contains',
          id,
        ),

        orderBy(
          'lastMessageAt',
          'desc',
        ),

        limit(
          this.conversationPageSize,
        ),
      );

    const snapshot =
      await getDocs(
        conversationsQuery,
      );

    return snapshot.docs.map(
      (document) =>
        ({
          id: document.id,
          ...document.data(),
        }) as ChatConversation,
    );
  }


  // ==============================================================
  // GET CONVERSATION
  // ==============================================================

  async getConversation(
    conversationId: string,
  ): Promise<ChatConversation | null> {
    const id =
      conversationId.trim();

    if (!id) {
      throw new Error(
        'Conversation ID is required.',
      );
    }

    const snapshot =
      await getDoc(
        this.conversationDocument(id),
      );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as ChatConversation;
  }


  // ==============================================================
  // FIND DIRECT CONVERSATION
  // ==============================================================

  async findDirectConversation(
    currentUserId: string,
    otherUserId: string,
  ): Promise<ChatConversation | null> {
    const currentId =
      currentUserId.trim();

    const otherId =
      otherUserId.trim();

    if (!currentId) {
      throw new Error(
        'Current user ID is required.',
      );
    }

    if (!otherId) {
      throw new Error(
        'Other user ID is required.',
      );
    }

    if (
      currentId === otherId
    ) {
      throw new Error(
        'You cannot start a conversation with yourself.',
      );
    }

    const conversationsQuery =
      query(
        this.conversationsCollection(),

        where(
          'type',
          '==',
          'direct',
        ),

        where(
          'participantIds',
          'array-contains',
          currentId,
        ),

        limit(
          this.conversationPageSize,
        ),
      );

    const snapshot =
      await getDocs(
        conversationsQuery,
      );

    const conversation =
      snapshot.docs.find(
        (document) => {
          const data =
            document.data();

          const participantIds =
            Array.isArray(
              data['participantIds'],
            )
              ? data[
                  'participantIds'
                ] as string[]
              : [];

          return (
            participantIds.length ===
              2 &&
            participantIds.includes(
              otherId,
            )
          );
        },
      );

    if (!conversation) {
      return null;
    }

    return {
      id: conversation.id,
      ...conversation.data(),
    } as ChatConversation;
  }


  // ==============================================================
  // CREATE DIRECT CONVERSATION
  // ==============================================================

  async createDirectConversation(
    input: CreateDirectConversationInput,
  ): Promise<ChatConversation> {
    const currentUserId =
      input.currentUser.userId.trim();

    const otherUserId =
      input.otherUser.userId.trim();

    if (!currentUserId) {
      throw new Error(
        'Current user ID is required.',
      );
    }

    if (!otherUserId) {
      throw new Error(
        'Other user ID is required.',
      );
    }

    if (
      currentUserId === otherUserId
    ) {
      throw new Error(
        'You cannot start a conversation with yourself.',
      );
    }

    const existing =
      await this.findDirectConversation(
        currentUserId,
        otherUserId,
      );

    if (existing) {
      return existing;
    }

    const currentParticipant:
      ChatParticipant = {
      userId:
        currentUserId,

      displayName:
        input.currentUser.displayName ||
        'Zebron Community Member',

      ...(input.currentUser.photoUrl
        ? {
            photoUrl:
              input.currentUser.photoUrl,
          }
        : {}),
    };

    const otherParticipant:
      ChatParticipant = {
      userId:
        otherUserId,

      displayName:
        input.otherUser.displayName ||
        'Zebron Community Member',

      ...(input.otherUser.photoUrl
        ? {
            photoUrl:
              input.otherUser.photoUrl,
          }
        : {}),
    };

    const participants:
      ChatParticipant[] = [
      currentParticipant,
      otherParticipant,
    ];

    const participantIds =
      participants
        .map(
          (participant) =>
            participant.userId,
        )
        .sort();

const conversationData = {
  type:
    'direct' as ChatConversationType,

  participantIds,

  participantInfo:
    participants,

  lastMessage:
    '',

  lastMessageSenderId:
    '',

  lastMessageAt:
    null,

  unreadCounts: {
    [currentUserId]: 0,
    [otherUserId]: 0,
  },

  createdAt:
    serverTimestamp(),

  updatedAt:
    serverTimestamp(),
};

    const reference =
      await addDoc(
        this.conversationsCollection(),
        conversationData,
      );

    const conversation =
      await getDoc(
        reference,
      );

    if (!conversation.exists()) {
      throw new Error(
        'Conversation could not be created.',
      );
    }

    this.logger.info(
      'ChatService',
      'Direct community chat conversation created.',
      {
        conversationId:
          conversation.id,
        currentUserId,
        otherUserId,
      },
    );

    return {
      id: conversation.id,
      ...conversation.data(),
    } as ChatConversation;
  }


  // ==============================================================
  // GET MESSAGES
  // ==============================================================

  async getMessages(
    conversationId: string,
  ): Promise<ChatMessage[]> {
    const id =
      conversationId.trim();

    if (!id) {
      throw new Error(
        'Conversation ID is required.',
      );
    }

    const messagesQuery =
      query(
        this.messagesCollection(id),

        orderBy(
          'createdAt',
          'asc',
        ),

        limit(
          this.messagePageSize,
        ),
      );

    const snapshot =
      await getDocs(
        messagesQuery,
      );

    return snapshot.docs.map(
      (document) =>
        this.mapMessage(
          document.id,
          document.data(),
        ),
    );
  }


  // ==============================================================
  // REAL-TIME MESSAGE LISTENER
  // ==============================================================

  subscribeToMessages(
    conversationId: string,

    callback: (
      messages: ChatMessage[],
    ) => void,

    onError?: (
      error: Error,
    ) => void,
  ): Unsubscribe {
    const id =
      conversationId.trim();

    if (!id) {
      throw new Error(
        'Conversation ID is required.',
      );
    }

    const messagesQuery =
      query(
        this.messagesCollection(id),

        orderBy(
          'createdAt',
          'asc',
        ),

        limit(
          this.messagePageSize,
        ),
      );

    return onSnapshot(
      messagesQuery,

      (snapshot) => {
        const messages =
          snapshot.docs.map(
            (document) =>
              this.mapMessage(
                document.id,
                document.data(),
              ),
          );

        callback(messages);
      },

      (error) => {
        this.logger.error(
          'ChatService',
          'Community chat realtime listener failed.',
          {
            conversationId: id,
            error: error.message,
          },
        );

        if (onError) {
          onError(error);
        }
      },
    );
  }


  // ==============================================================
  // UPLOAD ATTACHMENT
  // ==============================================================

  async uploadAttachment(
    conversationId: string,
    file: File,
    onProgress?: (
      progress: number,
    ) => void,
  ): Promise<ChatAttachment> {
    const id =
      conversationId.trim();

    if (!id) {
      throw new Error(
        'Conversation ID is required.',
      );
    }

    if (!file) {
      throw new Error(
        'A file is required.',
      );
    }

    if (
      file.size <= 0
    ) {
      throw new Error(
        'The selected file is empty.',
      );
    }

    if (
      file.size >
      this.maxAttachmentSize
    ) {
      throw new Error(
        'Attachments cannot exceed 50 MB.',
      );
    }

    const conversationSnapshot =
      await getDoc(
        this.conversationDocument(id),
      );

    if (
      !conversationSnapshot.exists()
    ) {
      throw new Error(
        'Conversation could not be found.',
      );
    }

    const storageReference =
      this.attachmentStorageReference(
        id,
        file,
      );

    this.logger.info(
      'ChatService',
      'Starting community chat attachment upload.',
      {
        conversationId: id,
        fileName: file.name,
        contentType:
          file.type ||
          'application/octet-stream',
        size: file.size,
      },
    );

    try {
      const uploadTask =
        uploadBytesResumable(
          storageReference,
          file,
          {
            contentType:
              file.type ||
              'application/octet-stream',
          },
        );

      await this.waitForUpload(
        uploadTask,
        onProgress,
      );

      const url =
        await getDownloadURL(
          storageReference,
        );

      const attachment:
        ChatAttachment = {
        name: file.name,

        url,

        storagePath:
          storageReference.fullPath,

        contentType:
          file.type ||
          'application/octet-stream',

        size:
          file.size,
      };

      this.logger.info(
        'ChatService',
        'Community chat attachment upload completed.',
        {
          conversationId: id,

          fileName:
            file.name,

          contentType:
            attachment.contentType,

          size:
            attachment.size,

          storagePath:
            attachment.storagePath,
        },
      );

      return attachment;
    } catch (error) {
      this.logger.error(
        'ChatService',
        'Community chat attachment upload failed.',
        {
          conversationId: id,

          fileName:
            file.name,

          contentType:
            file.type,

          size:
            file.size,

          error:
            this.getErrorMessage(
              error,
              'Unable to upload attachment.',
            ),
        },
      );

      throw new Error(
        this.getErrorMessage(
          error,
          'Unable to upload attachment.',
        ),
      );
    }
  }


  // ==============================================================
  // SEND MESSAGE
  // ==============================================================

async sendMessage(
  input: SendChatMessageInput,
): Promise<string> {
  const conversationId =
    input.conversationId.trim();

  const senderId =
    input.senderId.trim();

  const content =
    input.content.trim();

  if (!conversationId) {
    throw new Error(
      'Conversation ID is required.',
    );
  }

  if (!senderId) {
    throw new Error(
      'Sender ID is required.',
    );
  }

  if (!content && !input.attachment) {
    throw new Error(
      'Message cannot be empty.',
    );
  }

  if (content.length > 5000) {
    throw new Error(
      'Message cannot exceed 5,000 characters.',
    );
  }

  const conversationRef =
    this.conversationDocument(
      conversationId,
    );

  const messagesRef =
    this.messagesCollection(
      conversationId,
    );

  const messageRef =
    doc(messagesRef);

  await runTransaction(
    firestore,
    async (transaction) => {
      const conversationSnapshot =
        await transaction.get(
          conversationRef,
        );

      if (!conversationSnapshot.exists()) {
        throw new Error(
          'Conversation could not be found.',
        );
      }

      const conversationData =
        conversationSnapshot.data();

      const participantIds =
        Array.isArray(
          conversationData['participantIds'],
        )
          ? (
              conversationData[
                'participantIds'
              ] as string[]
            )
          : [];

      if (
        !participantIds.includes(
          senderId,
        )
      ) {
        throw new Error(
          'You are not a participant in this conversation.',
        );
      }

      const unreadCountsData =
        conversationData[
          'unreadCounts'
        ];

      const unreadCounts: Record<
        string,
        number
      > = {};

      if (
        unreadCountsData &&
        typeof unreadCountsData ===
          'object'
      ) {
        for (
          const [userId, value]
          of Object.entries(
            unreadCountsData,
          )
        ) {
          if (
            typeof value ===
            'number'
          ) {
            unreadCounts[userId] =
              Math.max(0, value);
          }
        }
      }

      for (
        const participantId
        of participantIds
      ) {
        if (
          unreadCounts[
            participantId
          ] === undefined
        ) {
          unreadCounts[
            participantId
          ] = 0;
        }
      }

      /**
       * The sender's own unread count should
       * never increase when they send a message.
       */
      unreadCounts[senderId] =
        Math.max(
          0,
          unreadCounts[senderId] ?? 0,
        );

      /**
       * Every other participant receives one
       * unread message.
       */
      for (
        const participantId
        of participantIds
      ) {
        if (
          participantId ===
          senderId
        ) {
          continue;
        }

        unreadCounts[
          participantId
        ] =
          (
            unreadCounts[
              participantId
            ] ?? 0
          ) + 1;
      }

      const messageType =
        input.type ??
        (
          input.attachment
            ? this.getAttachmentMessageType(
                input.attachment.contentType,
              )
            : 'text'
        );

      const messageData = {
        conversationId,

        senderId,

        content,

        type:
          messageType,

        attachment:
          input.attachment ??
          null,

        status:
          'sent' as ChatMessageStatus,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),

        readBy: [
          senderId,
        ],
      };

      const lastMessage =
        this.getMessagePreview(
          content,
          messageType,
          input.attachment,
        );

      transaction.set(
        messageRef,
        messageData,
      );

      transaction.update(
        conversationRef,
        {
          lastMessage,

          lastMessageSenderId:
            senderId,

          lastMessageAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          unreadCounts,
        },
      );
    },
  );

  this.logger.info(
    'ChatService',
    'Community chat message sent.',
    {
      conversationId,
      messageId: messageRef.id,
      senderId,
      type:
        input.type ?? 'text',
    },
  );

  return messageRef.id;
}


  // ==============================================================
  // MARK CONVERSATION AS READ
  // ==============================================================

  async markConversationAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const conversation = conversationId.trim();
    const user = userId.trim();

    if (!conversation) {
      throw new Error('Conversation ID is required.');
    }

    if (!user) {
      throw new Error('User ID is required.');
    }

    const conversationReference =
      this.conversationDocument(conversation);

    await runTransaction(
      firestore,
      async (transaction) => {
        const snapshot = await transaction.get(
          conversationReference,
        );

        if (!snapshot.exists()) {
          throw new Error('Conversation could not be found.');
        }

        const data = snapshot.data();
        const unreadCountsData = data['unreadCounts'];
        const unreadCounts: Record<string, number> = {};

        if (
          unreadCountsData &&
          typeof unreadCountsData === 'object'
        ) {
          for (const [participantId, value] of Object.entries(
            unreadCountsData,
          )) {
            if (typeof value === 'number') {
              unreadCounts[participantId] = Math.max(0, value);
            }
          }
        }

        unreadCounts[user] = 0;

        transaction.update(conversationReference, {
          unreadCounts,
          updatedAt: serverTimestamp(),
        });
      },
    );

    this.logger.debug(
      'ChatService',
      'Community chat conversation marked as read.',
      {
        conversationId: conversation,
        userId: user,
      },
    );
  }


  // ==============================================================
  // MARK MESSAGE AS READ
  // ==============================================================

async markMessageAsRead(
  conversationId: string,
  messageId: string,
  userId: string,
): Promise<void> {
  const conversationIdValue =
    conversationId.trim();

  const messageIdValue =
    messageId.trim();

  const userIdValue =
    userId.trim();

  if (!conversationIdValue) {
    throw new Error(
      'Conversation ID is required.',
    );
  }

  if (!messageIdValue) {
    throw new Error(
      'Message ID is required.',
    );
  }

  if (!userIdValue) {
    throw new Error(
      'User ID is required.',
    );
  }

  const conversationRef =
    this.conversationDocument(
      conversationIdValue,
    );

  const messageRef =
    doc(
      this.messagesCollection(
        conversationIdValue,
      ),
      messageIdValue,
    );

  await runTransaction(
    this.db,
    async (transaction) => {
      const [
        conversationSnapshot,
        messageSnapshot,
      ] = await Promise.all([
        transaction.get(
          conversationRef,
        ),

        transaction.get(
          messageRef,
        ),
      ]);

      if (
        !conversationSnapshot.exists()
      ) {
        throw new Error(
          'Conversation could not be found.',
        );
      }

      if (
        !messageSnapshot.exists()
      ) {
        throw new Error(
          'Message could not be found.',
        );
      }

      const messageData =
        messageSnapshot.data();

      const senderId =
        typeof messageData[
          'senderId'
        ] === 'string'
          ? messageData[
              'senderId'
            ]
          : '';

      if (
        senderId === userIdValue
      ) {
        return;
      }

      const existingReadBy =
        Array.isArray(
          messageData[
            'readBy'
          ],
        )
          ? (
              messageData[
                'readBy'
              ] as string[]
            )
          : [];

      if (
        existingReadBy.includes(
          userIdValue,
        )
      ) {
        return;
      }

      const updatedReadBy = [
        ...existingReadBy,
        userIdValue,
      ];

      const conversationData =
        conversationSnapshot.data();

      const rawUnreadCounts =
        conversationData[
          'unreadCounts'
        ];

      const unreadCounts: Record<
        string,
        number
      > = {};

      if (
        rawUnreadCounts &&
        typeof rawUnreadCounts ===
          'object'
      ) {
        for (
          const [participantId, value]
          of Object.entries(
            rawUnreadCounts,
          )
        ) {
          if (
            typeof value ===
            'number'
          ) {
            unreadCounts[
              participantId
            ] = Math.max(
              0,
              value,
            );
          }
        }
      }

      const currentUnreadCount =
        unreadCounts[
          userIdValue
        ] ?? 0;

      unreadCounts[
        userIdValue
      ] = Math.max(
        0,
        currentUnreadCount - 1,
      );

      transaction.update(
        messageRef,
        {
          readBy:
            updatedReadBy,

          status:
            'read' as ChatMessageStatus,

          updatedAt:
            serverTimestamp(),
        },
      );

      transaction.update(
        conversationRef,
        {
          unreadCounts,

          updatedAt:
            serverTimestamp(),
        },
      );
    },
  );

  this.logger.debug(
    'ChatService',
    'Community chat message marked as read.',
    {
      conversationId:
        conversationIdValue,
      messageId:
        messageIdValue,
      userId:
        userIdValue,
    },
  );
}

  // ==============================================================
  // DELETE ATTACHMENT
  // ==============================================================

  async deleteAttachment(
    storagePath: string,
  ): Promise<void> {
    const path =
      storagePath.trim();

    if (!path) {
      throw new Error(
        'Storage path is required.',
      );
    }

    const storageReference =
      ref(
        this.storage,
        path,
      );

    try {
      await deleteObject(
        storageReference,
      );

      this.logger.info(
        'ChatService',
        'Community chat attachment deleted from Storage.',
        {
          storagePath: path,
        },
      );
    } catch (error) {
      this.logger.error(
        'ChatService',
        'Failed to delete community chat attachment.',
        {
          storagePath: path,

          error:
            this.getErrorMessage(
              error,
              'Unable to delete attachment.',
            ),
        },
      );

      throw new Error(
        this.getErrorMessage(
          error,
          'Unable to delete attachment.',
        ),
      );
    }
  }


  // ==============================================================
  // WAIT FOR UPLOAD
  // ==============================================================

  private waitForUpload(
    uploadTask: UploadTask,

    onProgress?: (
      progress: number,
    ) => void,
  ): Promise<void> {
    return new Promise(
      (
        resolve,
        reject,
      ) => {
        const unsubscribe =
          uploadTask.on(
            'state_changed',

            (snapshot) => {
              if (
                snapshot.totalBytes <= 0
              ) {
                onProgress?.(0);

                return;
              }

              const progress =
                Math.round(
                  (
                    snapshot.bytesTransferred /
                    snapshot.totalBytes
                  ) * 100,
                );

              onProgress?.(
                progress,
              );
            },

            (error) => {
              unsubscribe();

              reject(error);
            },

            () => {
              onProgress?.(
                100,
              );

              unsubscribe();

              resolve();
            },
          );
      },
    );
  }


  // ==============================================================
  // MAP FIRESTORE MESSAGE
  // ==============================================================

  private mapMessage(
    messageId: string,
    data: DocumentData,
  ): ChatMessage {
    const type =
      this.normalizeMessageType(
        data['type'],
        data['attachment'],
      );

    const attachment =
      this.normalizeAttachment(
        data['attachment'],
      );

    return {
      id:
        messageId,

      conversationId:
        String(
          data['conversationId'] ??
          '',
        ),

      senderId:
        String(
          data['senderId'] ??
          '',
        ),

      content:
        String(
          data['content'] ??
          '',
        ),

      type,

      attachment,

      status:
        this.normalizeMessageStatus(
          data['status'],
        ),

      createdAt:
        data['createdAt'] ??
        null,

      updatedAt:
        data['updatedAt'] ??
        null,

      readBy:
        this.normalizeReadBy(
          data['readBy'],
        ),
    };
  }


  // ==============================================================
  // NORMALIZE MESSAGE TYPE
  // ==============================================================

  private normalizeMessageType(
    value: unknown,
    attachment: unknown,
  ): ChatMessageType {
    if (
      value === 'text' ||
      value === 'image' ||
      value === 'video' ||
      value === 'audio' ||
      value === 'file'
    ) {
      return value;
    }

    /*
     * Existing Firestore messages may not contain `type`.
     *
     * If an attachment exists, infer its type from contentType.
     * Otherwise the message is text.
     */
    if (
      attachment &&
      typeof attachment ===
        'object'
    ) {
      const contentType =
        String(
          (
            attachment as Record<
              string,
              unknown
            >
          )[
            'contentType'
          ] ?? '',
        ).toLowerCase();

      if (
        contentType.startsWith(
          'image/',
        )
      ) {
        return 'image';
      }

      if (
        contentType.startsWith(
          'video/',
        )
      ) {
        return 'video';
      }

      if (
        contentType.startsWith(
          'audio/',
        )
      ) {
        return 'audio';
      }

      return 'file';
    }

    return 'text';
  }


  // ==============================================================
  // NORMALIZE ATTACHMENT
  // ==============================================================

  private normalizeAttachment(
    value: unknown,
  ): ChatAttachment | null {
    if (
      !value ||
      typeof value !==
        'object'
    ) {
      return null;
    }

    const data =
      value as Record<
        string,
        unknown
      >;

    const name =
      String(
        data['name'] ?? '',
      );

    const url =
      String(
        data['url'] ?? '',
      );

    const storagePath =
      String(
        data['storagePath'] ??
          '',
      );

    const contentType =
      String(
        data['contentType'] ??
          'application/octet-stream',
      );

    const size =
      Number(
        data['size'] ?? 0,
      );

    if (
      !name ||
      !url ||
      !storagePath
    ) {
      return null;
    }

    return {
      name,

      url,

      storagePath,

      contentType,

      size:
        Number.isFinite(size)
          ? size
          : 0,
    };
  }


  // ==============================================================
  // NORMALIZE READ BY
  // ==============================================================

  private normalizeReadBy(
    value: unknown,
  ): string[] {
    /*
     * New format:
     *
     * readBy: ['uid1', 'uid2']
     */
    if (
      Array.isArray(value)
    ) {
      return value
        .filter(
          (
            item,
          ): item is string =>
            typeof item ===
            'string',
        )
        .filter(
          (
            item,
          ) =>
            item.trim().length >
            0,
        );
    }

    /*
     * Legacy format:
     *
     * readBy: {
     *   uid: Timestamp
     * }
     *
     * Convert the object keys to the model's string[] format.
     */
    if (
      value &&
      typeof value ===
        'object'
    ) {
      return Object.keys(
        value,
      );
    }

    return [];
  }


  // ==============================================================
  // NORMALIZE MESSAGE STATUS
  // ==============================================================

  private normalizeMessageStatus(
    value: unknown,
  ): ChatMessageStatus {
    if (
      value === 'sent' ||
      value === 'delivered' ||
      value === 'read' ||
      value === 'deleted'
    ) {
      return value;
    }

    return 'sent';
  }


  // ==============================================================
  // ATTACHMENT PREVIEW TEXT
  // ==============================================================

  private getAttachmentPreviewText(
    type: ChatMessageType,
    attachment:
      | ChatAttachment
      | null,
  ): string {
    if (!attachment) {
      return '';
    }

    switch (type) {
      case 'image':
        return '📷 Photo';

      case 'video':
        return '🎥 Video';

      case 'audio':
        return '🎤 Voice message';

      case 'file':
        return `📎 ${attachment.name}`;

      default:
        return attachment.name;
    }
  }


  // ==============================================================
  // SANITIZE FILE NAME
  // ==============================================================

  private sanitizeFileName(
    fileName: string,
  ): string {
    const fallback =
      'attachment';

    const name =
      fileName
        .trim()
        .replace(
          /[\\/:*?"<>|#%{}[\]^`]/g,
          '_',
        )
        .replace(
          /\s+/g,
          '_',
        );

    if (!name) {
      return fallback;
    }

    /*
     * Keep the path reasonably short.
     */
    return name.slice(
      0,
      180,
    );
  }


  // ==============================================================
  // UNIQUE ID
  // ==============================================================

  private generateUniqueId(): string {
    if (
      typeof crypto !==
        'undefined' &&
      typeof crypto.randomUUID ===
        'function'
    ) {
      return crypto.randomUUID();
    }

    return [
      Date.now().toString(
        36,
      ),

      Math.random()
        .toString(36)
        .slice(2),
    ].join('-');
  }


  // ==============================================================
  // QUIET ATTACHMENT DELETE
  // ==============================================================

  private async deleteAttachmentQuietly(
    storagePath: string,

    context: {
      conversationId: string;
      senderId: string;
      messageId: string;
    },
  ): Promise<void> {
    try {
      await deleteObject(
        ref(
          this.storage,
          storagePath,
        ),
      );

      this.logger.info(
        'ChatService',
        'Orphaned community chat attachment cleaned up.',
        {
          conversationId:
            context.conversationId,

          senderId:
            context.senderId,

          messageId:
            context.messageId,

          storagePath,
        },
      );
    } catch (cleanupError) {
      /*
       * Cleanup failure should not replace the original
       * Firestore error. Log it for troubleshooting.
       */
      this.logger.error(
        'ChatService',
        'Failed to clean up orphaned community chat attachment.',
        {
          conversationId:
            context.conversationId,

          senderId:
            context.senderId,

          messageId:
            context.messageId,

          storagePath,

          error:
            this.getErrorMessage(
              cleanupError,
              'Attachment cleanup failed.',
            ),
        },
      );
    }
  }


  // ==============================================================
  // ERROR NORMALIZATION
  // ==============================================================

  private getErrorMessage(
    error: unknown,
    fallback: string,
  ): string {
    if (
      error instanceof Error
    ) {
      return error.message;
    }

    if (
      typeof error ===
        'string' &&
      error.trim()
    ) {
      return error;
    }

    return fallback;
  }

  private getAttachmentMessageType(
  contentType: string,
): ChatMessageType {
  const normalized =
    contentType.toLowerCase();

  if (
    normalized.startsWith(
      'image/',
    )
  ) {
    return 'image';
  }

  if (
    normalized.startsWith(
      'video/',
    )
  ) {
    return 'video';
  }

  if (
    normalized.startsWith(
      'audio/',
    )
  ) {
    return 'audio';
  }

  return 'file';
}


private getMessagePreview(
  content: string,
  type: ChatMessageType,
  attachment?:
    ChatAttachment | null,
): string {
  if (content.trim()) {
    return content.trim();
  }

  switch (type) {
    case 'image':
      return '📷 Photo';

    case 'video':
      return '🎥 Video';

    case 'audio':
      return '🎵 Audio';

    case 'file':
      return attachment?.name
        ? `📎 ${attachment.name}`
        : '📎 File';

    default:
      return '';
  }
}
}