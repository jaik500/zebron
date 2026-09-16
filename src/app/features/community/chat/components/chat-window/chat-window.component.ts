import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  HostListener,
  inject,
  OnDestroy,
  output,
  signal,
  ViewChild,
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { ChatCallService } from '../../services/chat-call.service';

import {
  ChatMessage,
  ChatMessageType,
} from '../../models/chat-message.model';

import {
  ChatStore,
} from '../../store/chat.store';

import {
  ChatConversation,
} from '../../models/chat-conversation.model';

import {
  ChatParticipant,
} from '../../models/chat-participant.model';


@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  changeDetection:
    ChangeDetectionStrategy.OnPush,

  template: `
    @if (!store.activeConversation()) {
      <section
        class="flex h-full items-center justify-center bg-gray-50 px-6"
      >
        <div class="max-w-md text-center">
          <div
            class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"
          >
            <mat-icon
              class="!h-8 !w-8 !text-3xl text-blue-600"
            >
              chat
            </mat-icon>
          </div>

          <h2
            class="text-xl font-semibold text-gray-900"
          >
            Select a conversation
          </h2>

          <p
            class="mt-2 text-sm text-gray-500"
          >
            Choose a conversation from the list to start chatting.
          </p>
        </div>
      </section>
    } @else {
      <section
        class="relative flex h-full min-h-0 flex-col bg-gray-50"
      >

        <!-- =====================================================
             HEADER
             ===================================================== -->

        <header
          class="relative z-50 flex shrink-0 items-center gap-3 border-b bg-white px-4 py-3"
        >

          <!-- =====================================================
               MOBILE CONVERSATIONS BUTTON
               ===================================================== -->

          <button
            mat-icon-button
            type="button"
            class="relative z-50 shrink-0 md:hidden"
            [matMenuTriggerFor]="conversationMenu"
            aria-label="Open conversations"
            title="Open conversations"
          >
            <mat-icon>
              menu
            </mat-icon>
          </button>

          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200"
          >
            @if (otherParticipant()?.photoUrl) {
              <img
                [src]="otherParticipant()?.photoUrl"
                [alt]="
                  otherParticipant()?.displayName ||
                  'Community member'
                "
                class="h-full w-full object-cover"
              />
            } @else {
              <mat-icon class="text-gray-500">
                person
              </mat-icon>
            }
          </div>

          <div class="min-w-0 flex-1">
            <h2
              class="truncate text-sm font-semibold text-gray-900"
            >
              {{
                otherParticipant()?.displayName ||
                  'Zebron Community Member'
              }}
            </h2>

            <p
              class="text-xs text-gray-500"
            >
              Private conversation
            </p>
          </div>

          <button
            mat-icon-button
            type="button"
            aria-label="Start voice call"
            title="Start voice call"
            [disabled]="callService.state() !== 'idle' || !otherParticipant()?.userId"
            class="shrink-0 !text-gray-700 hover:!bg-gray-100"
            (click)="startVoiceCall()"
          >
            <mat-icon>call</mat-icon>
          </button>

          <button
  mat-icon-button
  type="button"
  aria-label="Start video call"
  title="Start video call"
  [disabled]="
    callService.state() !== 'idle' ||
    !otherParticipant()?.userId
  "
  class="shrink-0 !text-gray-700 hover:!bg-gray-100"
  (click)="startVideoCall()"
>
  <mat-icon>videocam</mat-icon>
</button>
        </header>


        <!-- =====================================================
             MOBILE CONVERSATIONS MATERIAL MENU
             ===================================================== -->

        <mat-menu
          #conversationMenu="matMenu"
          xPosition="after"
          yPosition="below"
          panelClass="chat-conversations-menu !w-[300px] !max-w-[calc(100vw-24px)] !min-w-0 !overflow-hidden !rounded-lg !bg-white !p-0 !shadow-xl md:!hidden"
          (menuOpened)="onConversationMenuOpened()"
        >

          <!-- HEADER -->
          <div
            class="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-3"
          >
            <mat-icon class="!text-gray-700">forum</mat-icon>

            <span
              class="text-sm font-semibold text-gray-900"
            >
              Chats
            </span>
          </div>

          <!-- EMPTY STATE -->
          @if (conversationsWithMessages().length === 0) {
            <div
              class="px-4 py-7 text-center"
            >
              <mat-icon
                class="!text-gray-300"
              >
                chat_bubble_outline
              </mat-icon>

              <p
                class="mt-2 text-xs text-gray-500"
              >
                No conversations yet
              </p>
            </div>
          } @else {

            <!-- CONVERSATIONS -->
            @for (
              conversation of conversationsWithMessages();
              track conversation.id
            ) {
              <button
                mat-menu-item
                type="button"
                class="!h-auto !min-h-0 !w-full !px-3 !py-3 !leading-normal"
                [class.!bg-blue-50]="
                  conversation.id ===
                  store.activeConversationId()
                "
                (click)="
                  selectConversationFromPopup(
                    conversation.id
                  )
                "
              >
                <div
                  class="flex w-full min-w-0 items-center gap-3"
                >
                  <!-- AVATAR -->
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100"
                  >
                    @if (
                      getParticipant(conversation)?.photoUrl
                    ) {
                      <img
                        [src]="
                          getParticipant(conversation)
                            ?.photoUrl
                        "
                        [alt]="
                          getParticipant(conversation)
                            ?.displayName ||
                          'Community member'
                        "
                        class="h-full w-full object-cover"
                      />
                    } @else {
                      <span
                        class="text-[10px] font-bold text-gray-600"
                      >
                        {{
                          getInitials(
                            getParticipant(conversation)
                              ?.displayName
                          )
                        }}
                      </span>
                    }
                  </div>

                  <!-- MESSAGE CONTENT -->
                  <div
                    class="min-w-0 flex-1"
                  >
                    <div
                      class="flex min-w-0 items-center gap-2"
                    >
                      <span
                        class="min-w-0 flex-1 truncate text-xs text-gray-900"
                        [class.font-bold]="
                          getUnreadCount(conversation) > 0
                        "
                        [class.font-semibold]="
                          getUnreadCount(conversation) === 0
                        "
                      >
                        {{
                          getParticipant(conversation)
                            ?.displayName ||
                          'Community Member'
                        }}
                      </span>

                      @if (
                        getUnreadCount(conversation) > 0
                      ) {
                        <span
                          class="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white"
                        >
                          {{
                            getUnreadCount(conversation) > 99
                              ? '99+'
                              : getUnreadCount(conversation)
                          }}
                        </span>
                      }
                    </div>

                    <div
                      class="mt-0.5 flex min-w-0 items-center gap-2"
                    >
                      <span
                        class="min-w-0 flex-1 truncate text-[10px] leading-4 text-gray-500"
                      >
                        {{
                          latestMessage(conversation)
                        }}
                      </span>

                      <span
                        class="shrink-0 whitespace-nowrap text-[9px] leading-4 text-gray-400"
                      >
                        {{
                          formatConversationTime(
                            conversation.lastMessageAt
                          )
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            }
          }

        </mat-menu>


        <!-- =====================================================
             MESSAGES
             ===================================================== -->

        <div
          #messageContainer
          data-chat-message-container
          class="min-h-0 flex-1 overflow-y-auto px-4 py-4"
        >
          @if (store.messagesLoading()) {
            <div
              class="flex h-full items-center justify-center"
            >
              <div class="text-center">
                <mat-icon
                  class="animate-spin text-blue-600"
                >
                  refresh
                </mat-icon>

                <p
                  class="mt-2 text-sm text-gray-500"
                >
                  Loading messages...
                </p>
              </div>
            </div>
          }

          @else if (store.messagesError()) {
            <div
              class="flex h-full items-center justify-center"
            >
              <div
                class="max-w-sm text-center"
              >
                <mat-icon
                  class="!h-10 !w-10 !text-4xl text-red-500"
                >
                  error_outline
                </mat-icon>

                <p
                  class="mt-3 text-sm font-medium text-gray-900"
                >
                  Unable to load messages
                </p>

                <p
                  class="mt-1 text-xs text-gray-500"
                >
                  {{ store.messagesError() }}
                </p>
              </div>
            </div>
          }

          @else if (
            store.messages().length === 0
          ) {
            <div
              class="flex h-full items-center justify-center"
            >
              <div
                class="max-w-sm text-center"
              >
                <mat-icon
                  class="!h-10 !w-10 !text-4xl text-gray-400"
                >
                  forum
                </mat-icon>

                <p
                  class="mt-3 text-sm font-medium text-gray-900"
                >
                  No messages yet
                </p>

                <p
                  class="mt-1 text-xs text-gray-500"
                >
                  Send the first message to start the conversation.
                </p>
              </div>
            </div>
          }

          @else {
            <div
              class="mx-auto flex max-w-3xl flex-col gap-3"
            >
              @for (
                message of store.messages();
                track message.id
              ) {
                <div
                  class="flex"
                  [class.justify-end]="
                    isCurrentUser(
                      message.senderId
                    )
                  "
                  [class.justify-start]="
                    !isCurrentUser(
                      message.senderId
                    )
                  "
                  (mouseenter)="
                    markAsRead(message.id)
                  "
                >
                  <div
                    class="max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm sm:max-w-[80%]"
                    [class.rounded-br-md]="
                      isCurrentUser(
                        message.senderId
                      )
                    "
                    [class.rounded-bl-md]="
                      !isCurrentUser(
                        message.senderId
                      )
                    "
                    [class.bg-blue-600]="
                      isCurrentUser(
                        message.senderId
                      )
                    "
                    [class.text-white]="
                      isCurrentUser(
                        message.senderId
                      )
                    "
                    [class.bg-white]="
                      !isCurrentUser(
                        message.senderId
                      )
                    "
                    [class.text-gray-900]="
                      !isCurrentUser(
                        message.senderId
                      )
                    "
                  >

                    <!-- =================================================
                         ATTACHMENT
                         ================================================= -->

                    @if (
                      message.attachment &&
                      message.type !== 'text'
                    ) {
                      <div class="mb-2">

                        <!-- IMAGE -->

                        @if (
                          message.type ===
                          'image'
                        ) {
                          <button
                            type="button"
                            class="block max-w-full overflow-hidden rounded-xl"
                            [attr.aria-label]="
                              'Open image ' +
                              message.attachment.name
                            "
                            (click)="
                              openAttachment(
                                message
                              )
                            "
                          >
                            <img
                              [src]="
                                message.attachment.url
                              "
                              [alt]="
                                message.attachment.name
                              "
                              class="max-h-[360px] max-w-full rounded-xl object-contain"
                              loading="lazy"
                            />
                          </button>
                        }

                        <!-- VIDEO -->

                        @else if (
                          message.type ===
                          'video'
                        ) {
                          <video
                            class="max-h-[360px] max-w-full rounded-xl"
                            controls
                            preload="metadata"
                            [src]="
                              message.attachment.url
                            "
                          >
                            Your browser does not support video playback.
                          </video>
                        }

                        <!-- AUDIO / VOICE NOTE -->

                        @else if (
                          message.type ===
                          'audio'
                        ) {
                          <div
                            class="min-w-[240px] rounded-xl bg-black/5 p-2"
                          >
                            <div
                              class="mb-1 flex items-center gap-2"
                            >
                              <mat-icon
                                class="!h-5 !w-5 !text-[20px]"
                              >
                                mic
                              </mat-icon>

                              <span
                                class="max-w-[180px] truncate text-xs font-medium"
                              >
                                {{
                                  message.attachment.name
                                }}
                              </span>
                            </div>

                            <audio
                              class="w-full"
                              controls
                              preload="metadata"
                              [src]="
                                message.attachment.url
                              "
                            >
                              Your browser does not support audio playback.
                            </audio>
                          </div>
                        }

                        <!-- GENERIC FILE -->

                        @else {
                          <a
                            class="flex items-center gap-3 rounded-xl border border-current/10 bg-black/5 px-3 py-3 transition hover:bg-black/10"
                            [href]="
                              message.attachment.url
                            "
                            target="_blank"
                            rel="noopener noreferrer"
                            [download]="
                              message.attachment.name
                            "
                          >
                            <div
                              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/10"
                            >
                              <mat-icon>
                                insert_drive_file
                              </mat-icon>
                            </div>

                            <div class="min-w-0">
                              <p
                                class="truncate text-sm font-medium"
                              >
                                {{
                                  message.attachment.name
                                }}
                              </p>

                              <p
                                class="text-[10px] opacity-70"
                              >
                                {{
                                  formatFileSize(
                                    message.attachment.size
                                  )
                                }}
                              </p>
                            </div>

                            <mat-icon
                              class="ml-auto shrink-0"
                            >
                              download
                            </mat-icon>
                          </a>
                        }
                      </div>
                    }


                    <!-- =================================================
                         TEXT CONTENT
                         ================================================= -->

                    @if (
                      message.content
                    ) {
                      <p
                        class="whitespace-pre-wrap break-words text-sm"
                      >
                        {{ message.content }}
                      </p>
                    }


                    <!-- =================================================
                         MESSAGE META
                         ================================================= -->

                    <div
                      class="mt-1 flex items-center justify-end gap-1"
                    >
                      <span
                        class="text-[10px]"
                        [class.text-blue-100]="
                          isCurrentUser(
                            message.senderId
                          )
                        "
                        [class.text-gray-400]="
                          !isCurrentUser(
                            message.senderId
                          )
                        "
                      >
                        {{
                          formatMessageTime(
                            message.createdAt
                          )
                        }}
                      </span>

                      @if (
                        isCurrentUser(
                          message.senderId
                        )
                      ) {
                        <mat-icon
                          class="!h-3 !w-3 !text-[12px]"
                          [class.text-blue-100]="
                            message.status !==
                            'read'
                          "
                          [class.text-white]="
                            message.status ===
                            'read'
                          "
                        >
                          {{
                            message.status ===
                            'read'
                              ? 'done_all'
                              : 'done'
                          }}
                        </mat-icon>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>


        <!-- =====================================================
             MESSAGE COMPOSER
             ===================================================== -->

        <form
          class="shrink-0 border-t bg-white p-3"
          (submit)="sendMessage($event)"
        >

          @if (
            store.messagesError()
          ) {
            <div
              class="mx-auto mb-2 max-w-3xl rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              {{ store.messagesError() }}
            </div>
          }


          <!-- ===================================================
               UPLOAD PROGRESS
               =================================================== -->

          @if (
            store.uploading()
          ) {
            <div
              class="mx-auto mb-3 max-w-3xl"
            >
              <div
                class="mb-1 flex items-center justify-between text-xs text-gray-500"
              >
                <span>
                  Uploading attachment...
                </span>

                <span>
                  {{ store.uploadProgress() }}%
                </span>
              </div>

              <div
                class="h-1.5 overflow-hidden rounded-full bg-gray-200"
              >
                <div
                  class="h-full rounded-full bg-blue-600 transition-all"
                  [style.width.%]="
                    store.uploadProgress()
                  "
                ></div>
              </div>
            </div>
          }


          <!-- ===================================================
               SELECTED ATTACHMENTS
               =================================================== -->

          @if (
            selectedFiles().length > 0
          ) {
            <div
              class="mx-auto mb-3 max-w-3xl"
            >
              <div
                class="flex gap-2 overflow-x-auto pb-1"
              >
                @for (
                  file of selectedFiles();
                  track fileKey(file, $index);
                  let index = $index
                ) {
                  <div
                    class="relative w-28 shrink-0 overflow-hidden rounded-xl border bg-gray-50"
                  >

                    @if (
                      file.type.startsWith(
                        'image/'
                      )
                    ) {
                      <img
                        [src]="
                          getPreviewUrl(
                            file,
                            index
                          )
                        "
                        [alt]="file.name"
                        class="h-24 w-full object-cover"
                      />
                    }

                    @else if (
                      file.type.startsWith(
                        'video/'
                      )
                    ) {
                      <div
                        class="flex h-24 items-center justify-center bg-gray-900 text-white"
                      >
                        <mat-icon
                          class="!h-8 !w-8 !text-3xl"
                        >
                          videocam
                        </mat-icon>
                      </div>
                    }

                    @else if (
                      file.type.startsWith(
                        'audio/'
                      )
                    ) {
                      <div
                        class="flex h-24 items-center justify-center bg-gray-100"
                      >
                        <mat-icon
                          class="!h-8 !w-8 !text-3xl text-blue-600"
                        >
                          audio_file
                        </mat-icon>
                      </div>
                    }

                    @else {
                      <div
                        class="flex h-24 items-center justify-center bg-gray-100"
                      >
                        <mat-icon
                          class="!h-8 !w-8 !text-3xl text-gray-500"
                        >
                          insert_drive_file
                        </mat-icon>
                      </div>
                    }

                    <div
                      class="px-2 py-1.5"
                    >
                      <p
                        class="truncate text-[10px] font-medium text-gray-700"
                      >
                        {{ file.name }}
                      </p>

                      <p
                        class="text-[9px] text-gray-400"
                      >
                        {{
                          formatFileSize(
                            file.size
                          )
                        }}
                      </p>
                    </div>

                    <button
                      mat-icon-button
                      type="button"
                      class="!absolute right-0.5 top-0.5 !h-7 !w-7 !bg-black/60 !text-white"
                      aria-label="Remove attachment"
                      [disabled]="
                        store.isBusy()
                      "
                      (click)="
                        removeFile(index)
                      "
                    >
                      <mat-icon
                        class="!text-[17px]"
                      >
                        close
                      </mat-icon>
                    </button>
                  </div>
                }
              </div>
            </div>
          }


          <!-- ===================================================
               COMPOSER ROW
               =================================================== -->

          <div
            class="relative mx-auto flex max-w-3xl items-end gap-1"
          >

            <!-- =================================================
                 EMOJI PICKER
                 ================================================= -->

            @if (
              showEmojiPicker()
            ) {
              <div
                class="absolute bottom-14 left-0 z-50 w-[300px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
              >
                <div
                  class="flex items-center justify-between border-b px-3 py-2"
                >
                  <span
                    class="text-xs font-semibold text-gray-700"
                  >
                    Emojis
                  </span>

                  <button
                    mat-icon-button
                    type="button"
                    class="!h-7 !w-7"
                    aria-label="Close emoji picker"
                    (click)="
                      closeEmojiPicker()
                    "
                  >
                    <mat-icon
                      class="!text-[18px]"
                    >
                      close
                    </mat-icon>
                  </button>
                </div>

                <div
                  class="max-h-[240px] overflow-y-auto p-2"
                >
                  @for (
                    emoji of emojis;
                    track emoji
                  ) {
                    <button
                      type="button"
                      class="inline-flex h-10 w-10 items-center justify-center rounded-lg text-2xl transition hover:bg-gray-100 active:bg-gray-200"
                      [attr.aria-label]="
                        'Insert ' + emoji
                      "
                      [attr.title]="emoji"
                      (mousedown)="
                        preventEmojiBlur($event)
                      "
                      (click)="
                        insertEmoji(emoji)
                      "
                    >
                      {{ emoji }}
                    </button>
                  }
                </div>
              </div>
            }


            <!-- =================================================
                 ATTACHMENT MENU
                 ================================================= -->

            <div
              class="relative"
            >
              <button
                mat-icon-button
                type="button"
                aria-label="Attach file"
                [attr.aria-expanded]="
                  showAttachmentMenu()
                "
                [disabled]="
                  store.isBusy()
                "
                (click)="
                  toggleAttachmentMenu(
                    $event
                  )
                "
              >
                <mat-icon>
                  attach_file
                </mat-icon>
              </button>

              @if (
                showAttachmentMenu()
              ) {
                <div
                  class="absolute bottom-12 left-0 z-50 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
                >

                  <button
                    type="button"
                    class="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    (click)="
                      choosePhotos()
                    "
                  >
                    <mat-icon class="text-blue-600">
                      image
                    </mat-icon>

                    <span>
                      Photos
                    </span>
                  </button>

                  <button
                    type="button"
                    class="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    (click)="
                      chooseVideos()
                    "
                  >
                    <mat-icon class="text-purple-600">
                      videocam
                    </mat-icon>

                    <span>
                      Videos
                    </span>
                  </button>

                  <button
                    type="button"
                    class="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    (click)="
                      chooseFiles()
                    "
                  >
                    <mat-icon class="text-gray-600">
                      folder
                    </mat-icon>

                    <span>
                      Files
                    </span>
                  </button>
                </div>
              }
            </div>


            <!-- =================================================
                 HIDDEN FILE INPUTS
                 ================================================= -->

            <input
              #photoInput
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              (change)="
                onFilesSelected(
                  $event
                )
              "
            />

            <input
              #videoInput
              type="file"
              accept="video/*"
              multiple
              class="hidden"
              (change)="
                onFilesSelected(
                  $event
                )
              "
            />

            <input
              #fileInput
              type="file"
              multiple
              class="hidden"
              (change)="
                onFilesSelected(
                  $event
                )
              "
            />


            <!-- =================================================
                 EMOJI BUTTON
                 ================================================= -->

            <button
              mat-icon-button
              type="button"
              aria-label="Add emoji"
              [attr.aria-expanded]="
                showEmojiPicker()
              "
              [disabled]="
                store.isBusy()
              "
              (click)="
                toggleEmojiPicker(
                  $event
                )
              "
            >
              <mat-icon>
                sentiment_satisfied_alt
              </mat-icon>
            </button>


            <!-- =================================================
                 MESSAGE INPUT
                 ================================================= -->

            <textarea
              #messageInput
              class="min-h-[44px] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              name="message"
              rows="1"
              maxlength="5000"
              placeholder="Write a message..."
              [(ngModel)]="messageContent"
              [disabled]="
                store.isBusy()
              "
              (focus)="
                rememberCursorPosition()
              "
              (click)="
                rememberCursorPosition()
              "
              (keyup)="
                rememberCursorPosition()
              "
              (select)="
                rememberCursorPosition()
              "
              (keydown)="
                onKeyDown($event)
              "
            ></textarea>


            <!-- =================================================
                 VOICE NOTE BUTTON
                 ================================================= -->

            @if (
              !messageContent().trim() &&
              selectedFiles().length === 0
            ) {
              <button
                mat-icon-button
                type="button"
                aria-label="Record voice note"
                [disabled]="
                  store.isBusy()
                "
                [class.!text-red-600]="
                  isRecording()
                "
                (click)="
                  toggleRecording()
                "
              >
                <mat-icon>
                  {{
                    isRecording()
                      ? 'stop'
                      : 'mic'
                  }}
                </mat-icon>
              </button>
            }


            <!-- =================================================
                 SEND BUTTON
                 ================================================= -->

            @if (
              messageContent().trim() ||
              selectedFiles().length > 0
            ) {
              <button
                mat-icon-button
                type="submit"
                aria-label="Send message"
                [disabled]="
                  store.isBusy()
                "
              >
                @if (
                  store.isBusy()
                ) {
                  <mat-icon
                    class="animate-spin"
                  >
                    refresh
                  </mat-icon>
                } @else {
                  <mat-icon>
                    send
                  </mat-icon>
                }
              </button>
            }
          </div>
        </form>
      </section>
    }
  `,
})
export class ChatWindowComponent
  implements OnDestroy {

  readonly store =
    inject(ChatStore);

  readonly callService =
    inject(ChatCallService);

  /**
   * Opens the mobile conversation drawer.
   *
   * The parent CommunityChatComponent owns the drawer state.
   */
  readonly openConversations =
    output<void>();


  @ViewChild('messageInput')
  private messageInput?: ElementRef<HTMLTextAreaElement>;


  @ViewChild('messageContainer')
  private messageContainer?: ElementRef<HTMLDivElement>;


  @ViewChild('photoInput')
  private photoInput?: ElementRef<HTMLInputElement>;


  @ViewChild('videoInput')
  private videoInput?: ElementRef<HTMLInputElement>;


  @ViewChild('fileInput')
  private fileInput?: ElementRef<HTMLInputElement>;


  readonly messageContent =
    signal('');


  readonly showEmojiPicker =
    signal(false);


  readonly showAttachmentMenu =
    signal(false);


  readonly selectedFiles =
    signal<File[]>([]);


  readonly isRecording =
    signal(false);


  private mediaRecorder:
    MediaRecorder | null = null;


  private mediaStream:
    MediaStream | null = null;


  private recordedChunks:
    Blob[] = [];


  private cursorStart = 0;


  private cursorEnd = 0;


  private previewUrls =
    new Map<string, string>();


  readonly emojis:
    readonly string[] = [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '😂',
      '🤣',
      '😊',
      '🙂',
      '🙃',
      '😉',
      '😌',
      '😍',
      '🥰',
      '😘',
      '😎',
      '🤩',
      '🥳',
      '🤔',
      '🤗',

      '😢',
      '😭',
      '😮',
      '😲',
      '😡',
      '😤',
      '😱',
      '😴',
      '🤐',
      '🤨',

      '🙏',
      '👏',
      '🙌',
      '👍',
      '👎',
      '👌',
      '✌️',
      '🤝',
      '💪',
      '👋',
      '☝️',

      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '💯',
      '🔥',
      '🎉',
      '✨',
      '⭐',
      '🌟',

      '🌍',
      '🌎',
      '🌏',
      '✈️',
      '🏠',
      '🏡',
      '💼',
      '🎓',
      '☕',
      '🍕',
      '🍔',
      '🎵',
      '🎶',
      '⚽',
      '🏀',

      '🚀',
      '💰',
      '🎯',
      '💡',
      '✅',
      '❌',
      '❗',
      '❓',
      '💬',
      '📱',
      '💻',
    ];


  constructor() {
    effect(() => {
      this.store.messages();

      queueMicrotask(() => {
        this.scrollToBottom();
      });
    });
  }


  // ============================================================
  // MOBILE CONVERSATION MENU
  // ============================================================

  onConversationMenuOpened(): void {
    this.closeEmojiPicker();
    this.closeAttachmentMenu();
  }

  async selectConversationFromPopup(
    conversationId: string,
  ): Promise<void> {
    await this.store.openConversation(
      conversationId,
    );
  }

  conversationsWithMessages(): ChatConversation[] {
    return this.store
      .conversations()
      .filter(
        (conversation) =>
          !!conversation.lastMessage ||
          !!conversation.lastMessageAt,
      );
  }

  getParticipant(
    conversation: ChatConversation,
  ): ChatParticipant | null {
    const currentUserId =
      this.store.currentUser()?.id;

    return (
      conversation.participantInfo.find(
        (participant) =>
          participant.userId !== currentUserId,
      ) ?? null
    );
  }

  getUnreadCount(
    conversation: ChatConversation,
  ): number {
    const userId =
      this.store.currentUser()?.id;

    if (!userId) {
      return 0;
    }

    return conversation.unreadCounts?.[userId] ?? 0;
  }

  latestMessage(
    conversation: ChatConversation,
  ): string {
    const message =
      conversation.lastMessage?.trim();

    if (!message) {
      return 'No messages yet';
    }

    const userId =
      this.store.currentUser()?.id;

    return conversation.lastMessageSenderId === userId
      ? `You: ${message}`
      : message;
  }

  getInitials(
    displayName: string | null | undefined,
  ): string {
    if (!displayName?.trim()) {
      return '?';
    }

    const parts = displayName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }

  formatConversationTime(value: unknown): string {
    if (!value) {
      return '';
    }

    let date: Date | null = null;

    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (value as { toDate?: unknown }).toDate === 'function'
    ) {
      date = (value as { toDate: () => Date }).toDate();
    } else if (value instanceof Date) {
      date = value;
    }

    if (!date) {
      return '';
    }

    const now = new Date();
    const difference = now.getTime() - date.getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (difference < minute) {
      return 'now';
    }

    if (difference < hour) {
      return `${Math.floor(difference / minute)}m`;
    }

    if (difference < day) {
      return `${Math.floor(difference / hour)}h`;
    }

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      });
    }

    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
  }


  // ==============================================================
  // PARTICIPANT
  // ==============================================================

  otherParticipant() {
    const conversation =
      this.store.activeConversation();

    if (!conversation) {
      return null;
    }

    const currentUserId =
      this.store.currentUser()?.id;

    return (
      conversation.participantInfo.find(
        (participant) =>
          participant.userId !==
          currentUserId,
      ) ?? null
    );
  }


  // ==============================================================
  // CURRENT USER
  // ==============================================================

  isCurrentUser(
    senderId: string,
  ): boolean {
    return (
      senderId ===
      this.store.currentUser()?.id
    );
  }


  // ==============================================================
  // MESSAGE TIME
  // ==============================================================

  formatMessageTime(
    timestamp: {
      toDate: () => Date;
    } | null,
  ): string {
    if (!timestamp) {
      return '';
    }

    const date =
      timestamp.toDate();

    return date.toLocaleTimeString(
      [],
      {
        hour: 'numeric',
        minute: '2-digit',
      },
    );
  }


  // ==============================================================
  // FILE SIZE
  // ==============================================================

  formatFileSize(
    size: number,
  ): string {
    if (
      !Number.isFinite(size) ||
      size <= 0
    ) {
      return '0 B';
    }

    const units = [
      'B',
      'KB',
      'MB',
      'GB',
    ];

    let value = size;

    let unitIndex = 0;

    while (
      value >= 1024 &&
      unitIndex <
        units.length - 1
    ) {
      value /= 1024;

      unitIndex++;
    }

    return `${value.toFixed(
      value >= 10 ||
        unitIndex === 0
        ? 0
        : 1,
    )} ${units[unitIndex]}`;
  }


  // ==============================================================
  // VOICE CALL
  // ==============================================================

  async startVoiceCall(): Promise<void> {
    const conversation = this.store.activeConversation();
    const participant = this.otherParticipant();

    if (!conversation || !participant?.userId) {
      return;
    }

    try {
      await this.callService.startVoiceCall(
        conversation.id,
        participant.userId,
      );
    } catch {
      // ChatCallService logs the technical error.
    }
  }

  async startVideoCall(): Promise<void> {
  const conversation =
    this.store.activeConversation();

  const participant =
    this.otherParticipant();

  if (
    !conversation ||
    !participant?.userId
  ) {
    return;
  }

  try {
    await this.callService.startVideoCall(
      conversation.id,
      participant.userId,
    );
  } catch {
    // ChatCallService logs the technical error.
  }
}


  // ==============================================================
  // SEND MESSAGE
  // ==============================================================

  async sendMessage(
    event: SubmitEvent,
  ): Promise<void> {
    event.preventDefault();

    this.closeEmojiPicker();

    this.closeAttachmentMenu();

    const content =
      this.messageContent().trim();

    const files =
      this.selectedFiles();

    if (
      !content &&
      files.length === 0
    ) {
      return;
    }

    if (
      this.store.isBusy()
    ) {
      return;
    }

    /*
     * Attachment messages are sent one attachment
     * per ChatMessage because the existing model uses
     * `attachment?: ChatAttachment | null`.
     */
    if (
      files.length > 0
    ) {
      const messageIds =
        await this.store.sendAttachments(
          files,
          content,
        );

      if (
        messageIds.length > 0
      ) {
        this.clearSelectedFiles();

        this.messageContent.set('');

        this.resetCursor();
      }

      return;
    }

    const messageId =
      await this.store.sendMessage(
        content,
      );

    if (messageId) {
      this.messageContent.set('');

      this.resetCursor();
    }
  }


  // ==============================================================
  // KEYBOARD
  // ==============================================================

  onKeyDown(
    event: KeyboardEvent,
  ): void {
    if (
      event.key !==
      'Enter'
    ) {
      return;
    }

    if (
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();

    void this.sendMessage(
      new SubmitEvent('submit'),
    );
  }


  // ==============================================================
  // ATTACHMENT MENU
  // ==============================================================

  toggleAttachmentMenu(
    event: MouseEvent,
  ): void {
    event.stopPropagation();

    this.closeEmojiPicker();

    this.showAttachmentMenu.update(
      (visible) => !visible,
    );
  }


  closeAttachmentMenu(): void {
    this.showAttachmentMenu.set(
      false,
    );
  }


  choosePhotos(): void {
    this.closeAttachmentMenu();

    this.photoInput?.nativeElement.click();
  }


  chooseVideos(): void {
    this.closeAttachmentMenu();

    this.videoInput?.nativeElement.click();
  }


  chooseFiles(): void {
    this.closeAttachmentMenu();

    this.fileInput?.nativeElement.click();
  }


  // ==============================================================
  // FILE SELECTION
  // ==============================================================

  onFilesSelected(
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement;

    const files =
      Array.from(
        input.files ?? [],
      );

    /*
     * Reset the input so selecting the same
     * file again still fires change.
     */
    input.value = '';

    if (
      files.length === 0
    ) {
      return;
    }

    this.addSelectedFiles(
      files,
    );
  }


  private addSelectedFiles(
    files: File[],
  ): void {
    const current =
      this.selectedFiles();

    const merged = [
      ...current,
      ...files,
    ];

    this.selectedFiles.set(
      merged,
    );
  }


  removeFile(
    index: number,
  ): void {
    const files =
      this.selectedFiles();

    if (
      index < 0 ||
      index >= files.length
    ) {
      return;
    }

    const file =
      files[index];

    this.revokePreviewUrl(
      file,
    );

    this.selectedFiles.set(
      files.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    );
  }


  clearSelectedFiles(): void {
    for (
      const file of this.selectedFiles()
    ) {
      this.revokePreviewUrl(
        file,
      );
    }

    this.selectedFiles.set([]);
  }


  // ==============================================================
  // FILE PREVIEWS
  // ==============================================================

  fileKey(
    file: File,
    index: number,
  ): string {
    return [
      file.name,
      file.size,
      file.lastModified,
      index,
    ].join(':');
  }


  getPreviewUrl(
    file: File,
    _index: number,
  ): string {
    const existing =
      this.previewUrls.get(
        this.fileKey(
          file,
          0,
        ),
      );

    if (existing) {
      return existing;
    }

    const url =
      URL.createObjectURL(
        file,
      );

    this.previewUrls.set(
      this.fileKey(
        file,
        0,
      ),
      url,
    );

    return url;
  }


  private revokePreviewUrl(
    file: File,
  ): void {
    const key =
      this.fileKey(
        file,
        0,
      );

    const url =
      this.previewUrls.get(
        key,
      );

    if (!url) {
      return;
    }

    URL.revokeObjectURL(
      url,
    );

    this.previewUrls.delete(
      key,
    );
  }


  // ==============================================================
  // OPEN ATTACHMENT
  // ==============================================================

  openAttachment(
    message: ChatMessage,
  ): void {
    const attachment =
      message.attachment;

    if (!attachment) {
      return;
    }

    window.open(
      attachment.url,
      '_blank',
      'noopener,noreferrer',
    );
  }


  // ==============================================================
  // EMOJI PICKER
  // ==============================================================

  toggleEmojiPicker(
    event: MouseEvent,
  ): void {
    event.stopPropagation();

    this.closeAttachmentMenu();

    this.rememberCursorPosition();

    this.showEmojiPicker.update(
      (visible) => !visible,
    );
  }


  closeEmojiPicker(): void {
    this.showEmojiPicker.set(
      false,
    );
  }


  preventEmojiBlur(
    event: MouseEvent,
  ): void {
    event.preventDefault();
  }


  rememberCursorPosition(): void {
    const textarea =
      this.messageInput
        ?.nativeElement;

    if (!textarea) {
      return;
    }

    this.cursorStart =
      textarea.selectionStart ??
      0;

    this.cursorEnd =
      textarea.selectionEnd ??
      this.cursorStart;
  }


  insertEmoji(
    emoji: string,
  ): void {
    const content =
      this.messageContent();

    const start =
      Math.max(
        0,
        Math.min(
          this.cursorStart,
          content.length,
        ),
      );

    const end =
      Math.max(
        start,
        Math.min(
          this.cursorEnd,
          content.length,
        ),
      );

    const updatedContent =
      content.slice(
        0,
        start,
      ) +
      emoji +
      content.slice(
        end,
      );

    this.messageContent.set(
      updatedContent,
    );

    const newCursorPosition =
      start + emoji.length;

    this.cursorStart =
      newCursorPosition;

    this.cursorEnd =
      newCursorPosition;

    this.showEmojiPicker.set(
      false,
    );

    requestAnimationFrame(
      () => {
        const textarea =
          this.messageInput
            ?.nativeElement;

        if (!textarea) {
          return;
        }

        textarea.focus();

        textarea.setSelectionRange(
          newCursorPosition,
          newCursorPosition,
        );
      },
    );
  }


  // ==============================================================
  // VOICE RECORDING
  // ==============================================================

  async toggleRecording(): Promise<void> {
    if (
      this.isRecording()
    ) {
      this.stopRecording();

      return;
    }

    await this.startRecording();
  }


  private async startRecording(): Promise<void> {
    if (
      typeof MediaRecorder ===
      'undefined'
    ) {
      return;
    }

    try {
      this.mediaStream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          },
        );

      this.recordedChunks = [];

      const mimeType =
        this.getSupportedAudioMimeType();

      this.mediaRecorder =
        mimeType
          ? new MediaRecorder(
              this.mediaStream,
              {
                mimeType,
              },
            )
          : new MediaRecorder(
              this.mediaStream,
            );

      this.mediaRecorder.ondataavailable =
        (event: BlobEvent) => {
          if (
            event.data.size > 0
          ) {
            this.recordedChunks.push(
              event.data,
            );
          }
        };

      this.mediaRecorder.onstop =
        () => {
          void this.handleRecordingComplete();
        };

      this.mediaRecorder.start();

      this.isRecording.set(
        true,
      );
    } catch {
      this.cleanupRecording();

      this.isRecording.set(
        false,
      );
    }
  }


  private stopRecording(): void {
    const recorder =
      this.mediaRecorder;

    if (!recorder) {
      this.cleanupRecording();

      this.isRecording.set(
        false,
      );

      return;
    }

    if (
      recorder.state !==
      'inactive'
    ) {
      recorder.stop();
    }

    this.isRecording.set(
      false,
    );
  }


  private async handleRecordingComplete(): Promise<void> {
    const chunks =
      this.recordedChunks;

    if (
      chunks.length === 0
    ) {
      this.cleanupRecording();

      return;
    }

    const mimeType =
      this.mediaRecorder?.mimeType ||
      'audio/webm';

    const blob =
      new Blob(
        chunks,
        {
          type: mimeType,
        },
      );

    const extension =
      this.getAudioExtension(
        mimeType,
      );

    const file =
      new File(
        [
          blob,
        ],
        `voice-note-${Date.now()}.${extension}`,
        {
          type: mimeType,
          lastModified:
            Date.now(),
        },
      );

    this.cleanupRecording();

    /*
     * A voice note is immediately sent as an audio
     * ChatMessage using the same attachment pipeline.
     */
    if (
      !this.store.activeConversation()
    ) {
      return;
    }

 await this.store.sendMessageWithAttachment(
  '',
  file,
);
  }


  private getSupportedAudioMimeType(): string {
    const supportedTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    for (
      const type of supportedTypes
    ) {
      if (
        MediaRecorder.isTypeSupported(
          type,
        )
      ) {
        return type;
      }
    }

    return '';
  }


  private getAudioExtension(
    mimeType: string,
  ): string {
    const normalized =
      mimeType.toLowerCase();

    if (
      normalized.includes(
        'mp4',
      )
    ) {
      return 'm4a';
    }

    if (
      normalized.includes(
        'ogg',
      )
    ) {
      return 'ogg';
    }

    return 'webm';
  }


  private cleanupRecording(): void {
    if (
      this.mediaStream
    ) {
      for (
        const track of this.mediaStream.getTracks()
      ) {
        track.stop();
      }
    }

    this.mediaStream =
      null;

    this.mediaRecorder =
      null;

    this.recordedChunks = [];
  }


  // ==============================================================
  // ESCAPE
  // ==============================================================

  @HostListener(
    'document:keydown.escape',
  )
  onEscape(): void {
    if (
      this.showEmojiPicker()
    ) {
      this.closeEmojiPicker();
    }

    if (
      this.showAttachmentMenu()
    ) {
      this.closeAttachmentMenu();
    }
  }


  // ==============================================================
  // MARK AS READ
  // ==============================================================

  markAsRead(
    messageId: string,
  ): void {
    const message =
      this.store
        .messages()
        .find(
          (item) =>
            item.id ===
            messageId,
        );

    if (!message) {
      return;
    }

    void this.store.markMessageAsRead(
      message,
    );
  }


  // ==============================================================
  // RESET CURSOR
  // ==============================================================

  private resetCursor(): void {
    this.cursorStart = 0;

    this.cursorEnd = 0;
  }


  // ==============================================================
  // SCROLL
  // ==============================================================

  private scrollToBottom(): void {
    const container =
      this.messageContainer
        ?.nativeElement;

    if (!container) {
      return;
    }

    container.scrollTop =
      container.scrollHeight;
  }


  // ==============================================================
  // DESTROY
  // ==============================================================

  ngOnDestroy(): void {
    this.cleanupRecording();

    this.clearSelectedFiles();

    for (
      const url of this.previewUrls.values()
    ) {
      URL.revokeObjectURL(
        url,
      );
    }

    this.previewUrls.clear();
  }
}