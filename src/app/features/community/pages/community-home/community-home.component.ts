import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import {
  Router,
  RouterLink,
} from '@angular/router';

import {
  MatButtonModule,
} from '@angular/material/button';

import {
  MatCardModule,
} from '@angular/material/card';

import {
  MatDividerModule,
} from '@angular/material/divider';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  MatSidenavModule,
} from '@angular/material/sidenav';

import {
  MatToolbarModule,
} from '@angular/material/toolbar';

import {
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';

import {
  MatMenuModule,
} from '@angular/material/menu';

import {
  MatTooltipModule,
} from '@angular/material/tooltip';

import {
  CommunityPostComposerComponent,
} from '../../components/community-post-composer/community-post-composer.component';

import {
  CommunityStore,
} from '../../store/community.store';

import {
  CommunityFeedComponent,
} from '../../components/community-feed/community-feed.component';

import {
  CommunitySidebarComponent,
} from '../../components/community-sidebar/community-sidebar.component';

import {
  CommunityTrendingComponent,
} from '../../components/community-trending/community-trending.component';

import {
  CommunityNotificationStore,
} from '../../store/community-notification.store';

import {
  AuthService,
} from '../../../../core/services/auth.service';

import {
  PageTitleService,
} from '../../../../core/services/page-title.service';

import {
  ChatStore,
} from '../../chat/store/chat.store';

import {
  ChatConversation,
} from '../../chat/models/chat-conversation.model';

import {
  ChatParticipant,
} from '../../chat/models/chat-participant.model';


@Component({
  selector: 'app-community-home',

  standalone: true,

  imports: [
    RouterLink,

    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
    MatDialogModule,
    MatMenuModule,
    MatTooltipModule,

    CommunitySidebarComponent,
    CommunityFeedComponent,
    CommunityTrendingComponent,
  ],

  template: `
    <mat-sidenav-container
      class="min-h-[calc(100vh-64px)]
             bg-[#F6FAFA]
             mt-15"
    >

      <!-- ==========================================================
           MOBILE NAVIGATION
           ========================================================== -->

      <mat-sidenav
        #mobileNav
        mode="over"
        class="w-72 bg-white p-5"
      >

        <div
          class="mb-6
                 flex
                 items-center
                 justify-between"
        >

          <h2
            class="text-lg
                   font-semibold
                   text-[#032D42]"
          >
            Community
          </h2>


          <button
            mat-icon-button
            type="button"
            aria-label="Close navigation"
            class="!text-[#032D42]"
            (click)="mobileNav.close()"
          >
            <mat-icon>
              close
            </mat-icon>
          </button>

        </div>


        <app-community-sidebar />

      </mat-sidenav>


      <!-- ==========================================================
           CONTENT
           ========================================================== -->

      <mat-sidenav-content>

        <!-- ========================================================
             COMMUNITY HEADER
             ======================================================== -->

        <div
          class="sticky
                 top-0
                 z-20
                 border-b
                 border-[#032D42]
                 bg-[#2A835F]
                 shadow-sm"
        >

          <div
            class="mx-auto
                   flex
                   max-w-7xl
                   items-center
                   gap-3
                   px-4
                   sm:px-6
                   lg:px-8"
          >

            <!-- ====================================================
                 MOBILE MENU
                 ==================================================== -->

            <button
              mat-icon-button
              type="button"
              class="lg:!hidden
                     !text-white"
              aria-label="Open community navigation"
              (click)="mobileNav.open()"
            >
              <mat-icon>
                menu
              </mat-icon>
            </button>


            <!-- ====================================================
                 COMMUNITY TITLE
                 ==================================================== -->

            <div
              class="min-w-0
                     flex-1"
            >

              <p
                class="hidden
                       text-sm
                       text-white/80
                       sm:block"
              >
                Connect, share and grow together.
              </p>

            </div>


            <!-- ====================================================
                 MESSAGES
                 ==================================================== -->

            <button
              mat-icon-button
              type="button"
              [matMenuTriggerFor]="messagesMenu"
              aria-label="Messages"
              matTooltip="Messages"
              class="relative
                     !text-white
                     hover:!bg-white/10"
            >

              <mat-icon>
                {{
                  hasUnreadChats()
                    ? 'chat'
                    : 'chat_bubble_outline'
                }}
              </mat-icon>


              <!-- ==================================================
                   TOTAL UNREAD MESSAGE BADGE
                   ================================================== -->

          @if (unreadChatCount() > 0) {
 <span
  class="pointer-events-none
         absolute
         bottom-0
         right-0
         z-20
         flex
         h-4
         min-w-4
         translate-x-1/4
         translate-y-1/4
         items-center
         justify-center
         rounded-full
         bg-red-500
         px-1
         text-[10px]
         font-bold
         leading-none
         text-white
         ring-2
         ring-[#032D42]"
>
    {{
      unreadChatCount() > 99
        ? '99+'
        : unreadChatCount()
    }}
  </span>
}

            </button>


            <!-- ====================================================
                 MESSAGES MATERIAL MENU
                 ==================================================== -->

            <mat-menu
              #messagesMenu="matMenu"
              xPosition="before"
              yPosition="below"
              panelClass="community-messages-menu"
            >

              <!-- ==================================================
                   MENU HEADER
                   ================================================== -->

              <div
                class="flex
                       w-full
                       items-center
                       justify-between
                       border-b
                       border-slate-200
                       px-4
                       py-3"
              >

                <div
                  class="flex
                         items-center
                         gap-2"
                >

                  <mat-icon
                    class="!text-[#2A835F]"
                  >
                    chat
                  </mat-icon>


                  <span
                    class="text-base
                           font-semibold
                           text-slate-800"
                  >
                    Messages
                  </span>

                </div>


                @if (unreadChatCount() > 0) {

                  <span
                    class="text-xs
                           font-medium
                           text-[#2A835F]"
                  >
                    {{
                      unreadChatCount()
                    }}
                    unread
                  </span>

                }

              </div>


              <!-- ==================================================
                   EMPTY STATE
                   ================================================== -->

              @if (
                messageConversations().length === 0
              ) {

                <div
                  class="flex
                         w-full
                         flex-col
                         items-center
                         px-6
                         py-10
                         text-center"
                >

                  <mat-icon
                    class="!mb-2
                           !h-10
                           !w-10
                           !text-4xl
                           !text-slate-300"
                  >
                    chat_bubble_outline
                  </mat-icon>


                  <span
                    class="text-sm
                           font-medium
                           text-slate-600"
                  >
                    No unread messages
                  </span>


                  <span
                    class="mt-1
                           text-xs
                           text-slate-400"
                  >
                    Your unread conversations will appear here.
                  </span>

                </div>

              } @else {

                <!-- ================================================
                     UNREAD CONVERSATIONS
                     ================================================ -->

                @for (
                  conversation of messageConversations();
                  track conversation.id
                ) {

                  <button
                    mat-menu-item
                    type="button"
                    class="!h-auto
                           !min-h-0
                           !w-full
                           !px-4
                           !py-3"
                    (click)="
                      openChatConversation(
                        conversation.id
                      )
                    "
                  >

                    <div
                      class="flex
                             w-full
                             min-w-0
                             items-center
                             gap-3"
                    >

                      <!-- ==========================================
                           PROFILE IMAGE
                           ========================================== -->

                      <div
                        class="flex
                               h-10
                               w-10
                               shrink-0
                               items-center
                               justify-center
                               overflow-hidden
                               rounded-full
                               bg-[#E5F4F4]"
                      >

                        @if (
                          getOtherParticipant(
                            conversation
                          )?.photoUrl
                        ) {

                          <img
                            [src]="
                              getOtherParticipant(
                                conversation
                              )?.photoUrl
                            "
                            [alt]="
                              getOtherParticipant(
                                conversation
                              )?.displayName ??
                              'Community member'
                            "
                            class="h-full
                                   w-full
                                   object-cover"
                          />

                        } @else {

                          <span
                            class="text-xs
                                   font-bold
                                   text-[#2A835F]"
                          >
                            {{
                              getInitials(
                                getOtherParticipant(
                                  conversation
                                )?.displayName
                              )
                            }}
                          </span>

                        }

                      </div>


                      <!-- ==========================================
                           MESSAGE INFORMATION
                           ========================================== -->

                      <div
                        class="min-w-0
                               flex-1"
                      >

                        <!-- ========================================
                             NAME + UNREAD COUNT
                             ======================================== -->

                        <div
                          class="flex
                                 min-w-0
                                 w-full
                                 items-center
                                 gap-3"
                        >

                          <!-- NAME -->

                          <span
                            class="min-w-0
                                   flex-1
                                   truncate
                                   text-sm
                                   leading-5
                                   font-bold
                                   text-slate-900"
                          >
                            {{
                              getOtherParticipant(
                                conversation
                              )?.displayName ??
                              'Community member'
                            }}
                          </span>


                          <!-- UNREAD COUNT -->

                          @if (
                            getUnreadCount(
                              conversation
                            ) > 0
                          ) {

                            <span
                              class="flex
                                     h-5
                                     min-w-5
                                     shrink-0
                                     items-center
                                     justify-center
                                     rounded-full
                                     bg-red-500
                                     px-1.5
                                     text-[10px]
                                     font-bold
                                     leading-none
                                     text-white"
                            >
                              {{
                                getUnreadCount(
                                  conversation
                                ) > 99
                                  ? '99+'
                                  : getUnreadCount(
                                      conversation
                                    )
                              }}
                            </span>

                          }

                        </div>


                        <!-- ========================================
                             MESSAGE + TIME
                             ======================================== -->

                        <div
                          class="flex
                                 min-w-0
                                 w-full
                                 items-center
                                 gap-3"
                        >

                          <!-- MESSAGE -->

                          <span
                            class="min-w-0
                                   flex-1
                                   truncate
                                   text-xs
                                   leading-5
                                   font-medium
                                   text-slate-700"
                          >
                            {{
                              getLatestMessage(
                                conversation
                              )
                            }}
                          </span>


                          <!-- TIME -->

                          <span
                            class="shrink-0
                                   whitespace-nowrap
                                   text-[10px]
                                   leading-5
                                   text-slate-400"
                          >
                            {{
                              formatChatDate(
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


              <!-- ==================================================
                   VIEW ALL MESSAGES
                   ================================================== -->

              <div
                class="border-t
                       border-slate-200"
              >

                <button
                  mat-menu-item
                  type="button"
                  class="!justify-center
                         !text-sm
                         !font-medium
                         !text-[#2A835F]"
                  (click)="openAllMessages()"
                >

                  <mat-icon>
                    forum
                  </mat-icon>

                  <span>
                    View all messages
                  </span>

                </button>

              </div>

            </mat-menu>


            <!-- ====================================================
                 NOTIFICATIONS
                 ==================================================== -->

            <a
              mat-icon-button
              routerLink="/community/notifications"
              aria-label="Notifications"
              matTooltip="Notifications"
              class="relative
                     !text-white
                     hover:!bg-white/10"
            >

              <mat-icon>
                {{
                  hasUnreadNotifications()
                    ? 'notifications'
                    : 'notifications_none'
                }}
              </mat-icon>


              <!-- UNREAD NOTIFICATION BADGE -->

              @if (
                hasUnreadNotifications()
              ) {

                <span
                  class="absolute
                         right-0.5
                         top-0.5
                         flex
                         h-4
                         min-w-4
                         items-center
                         justify-center
                         rounded-full
                         bg-red-500
                         px-1
                         text-[10px]
                         font-bold
                         leading-none
                         text-white
                         ring-2
                         ring-[#032D42]"
                >
                  {{
                    unreadNotificationCount() > 99
                      ? '99+'
                      : unreadNotificationCount()
                  }}
                </span>

              }

            </a>


            <!-- ====================================================
                 COMMUNITY PROFILE
                 ==================================================== -->

            @if (currentUserId()) {

              <a
                mat-icon-button
                [routerLink]="[
                  '/community/users',
                  currentUserId()
                ]"
                aria-label="My community profile"
                matTooltip="My profile"
                class="!text-white
                       hover:!bg-white/10"
              >

                <mat-icon>
                  account_circle
                </mat-icon>

              </a>

            }


            <!-- ====================================================
                 SETTINGS
                 ==================================================== -->

            @if (authService.isAdmin) {

              <a
                mat-icon-button
                routerLink="/admin/community/topics"
                aria-label="Settings"
                matTooltip="Settings"
                class="!text-white
                       hover:!bg-white/10"
              >

                <mat-icon>
                  settings
                </mat-icon>

              </a>

            }

          </div>

        </div>


        <!-- ========================================================
             MAIN LAYOUT
             ======================================================== -->

        <main
          class="mx-auto
                 max-w-7xl
                 px-4
                 py-6
                 sm:px-6
                 lg:px-8"
        >

          <div
            class="grid
                   grid-cols-1
                   gap-6
                   lg:grid-cols-[220px_minmax(0,1fr)_280px]"
          >

            <!-- ====================================================
                 LEFT NAVIGATION
                 ==================================================== -->

            <aside
              class="hidden
                     lg:block"
            >

              <div
                class="sticky
                       top-24"
              >

                <app-community-sidebar />

              </div>

            </aside>


            <!-- ====================================================
                 CENTER FEED
                 ==================================================== -->

            <section
              class="min-w-0"
            >

              <!-- COMPOSER -->

              <mat-card
                class="mb-5
                       !rounded-2xl
                       !border
                       !border-[#D6E6E7]
                       !bg-white
                       !shadow-none"
              >

                <button
                  mat-button
                  type="button"
                  class="!h-auto
                         !w-full
                         !justify-start
                         !rounded-xl
                         !px-4
                         !py-4
                         !text-left
                         !text-[#6F8B92]
                         hover:!bg-[#E5F4F4]"
                  (click)="openPostComposer()"
                >

                  <mat-icon
                    class="!text-[#007979]"
                  >
                    edit
                  </mat-icon>

                  <span
                    class="ml-2"
                  >
                    Share something with the community...
                  </span>

                </button>


                <mat-divider
                  class="!border-[#D6E6E7]"
                />


                <div
                  class="flex
                         items-center
                         gap-1
                         px-2
                         py-2"
                >

                  <button
                    mat-button
                    type="button"
                    class="!text-[#007979]
                           hover:!bg-[#E5F4F4]"
                  >

                    <mat-icon>
                      image
                    </mat-icon>

                    Photo

                  </button>


                  <button
                    mat-button
                    type="button"
                    class="!text-[#007979]
                           hover:!bg-[#E5F4F4]"
                  >

                    <mat-icon>
                      link
                    </mat-icon>

                    Resource

                  </button>


                  <button
                    mat-button
                    type="button"
                    class="!text-[#007979]
                           hover:!bg-[#E5F4F4]"
                  >

                    <mat-icon>
                      poll
                    </mat-icon>

                    Poll

                  </button>

                </div>

              </mat-card>


              <!-- ==================================================
                   ACTIVE TOPIC
                   ================================================== -->

              @if (store.selectedTopic()) {

                <div
                  class="mb-4
                         flex
                         items-center
                         justify-between"
                >

                  <div>

                    <div
                      class="text-sm
                             text-[#6F8B92]"
                    >
                      Topic
                    </div>


                    <h2
                      class="text-xl
                             font-semibold
                             text-[#032D42]"
                    >
                      {{
                        store.selectedTopic()?.name
                      }}
                    </h2>

                  </div>


                  <button
                    mat-button
                    type="button"
                    class="!text-[#007979]
                           hover:!bg-[#E5F4F4]"
                    (click)="clearTopic()"
                  >
                    Clear
                  </button>

                </div>

              }


              <!-- COMMUNITY FEED -->

              <app-community-feed />

            </section>


            <!-- ====================================================
                 RIGHT RAIL
                 ==================================================== -->

            <aside
              class="hidden
                     xl:block"
            >

              <div
                class="sticky
                       top-24"
              >

                <app-community-trending />

              </div>

            </aside>

          </div>

        </main>

      </mat-sidenav-content>

    </mat-sidenav-container>
  `,

  styles: [
    `
      /*
       * The Messages menu is rendered inside Angular Material's
       * CDK overlay container. These selectors intentionally target
       * only our named menu class.
       *
       * The panel is wider than Material's default menu width so the
       * avatar, name, unread count, message preview and timestamp
       * can all fit without horizontal scrolling.
       */

      .community-messages-menu.mat-mdc-menu-panel {
        width: 560px !important;
        min-width: 560px !important;
        max-width: calc(100vw - 16px) !important;
        box-sizing: border-box !important;
      }


      .community-messages-menu
      .mat-mdc-menu-content {
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        max-height: none !important;
        padding: 0 !important;
        overflow-x: hidden !important;
        overflow-y: visible !important;
        box-sizing: border-box !important;
      }


      .community-messages-menu
      .mat-mdc-menu-item {
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        min-height: 0 !important;
        height: auto !important;
        box-sizing: border-box !important;
      }


      .community-messages-menu
      .mat-mdc-menu-item-text {
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        box-sizing: border-box !important;
      }


      /*
       * Make sure the menu itself never creates a horizontal
       * scrollbar.
       */

      .community-messages-menu,
      .community-messages-menu * {
        max-width: 100% !important;
      }


      /*
       * On smaller screens, use almost the entire viewport width.
       */

      @media (max-width: 600px) {

        .community-messages-menu.mat-mdc-menu-panel {
          width: calc(100vw - 16px) !important;
          min-width: calc(100vw - 16px) !important;
          max-width: calc(100vw - 16px) !important;
        }

      }
    `,
  ],

  /*
   * The Angular Material menu is rendered in the CDK overlay container,
   * outside this component's host element. None encapsulation makes the
   * menu-specific CSS below apply to that overlay panel.
   */

  encapsulation: ViewEncapsulation.None,

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class CommunityHomeComponent
  implements OnInit {

  // =============================================================
  // STORES
  // =============================================================

  readonly store =
    inject(CommunityStore);


  readonly notificationStore =
    inject(
      CommunityNotificationStore,
    );


  readonly chatStore =
    inject(ChatStore);


  // =============================================================
  // SERVICES
  // =============================================================

  readonly authService =
    inject(AuthService);


  readonly pageTitleService =
    inject(PageTitleService);


  private readonly dialog =
    inject(MatDialog);


  private readonly router =
    inject(Router);


  // =============================================================
  // CHAT CONVERSATIONS
  // =============================================================

  /**
   * Only conversations that currently contain unread messages
   * are displayed in the Messages header menu.
   *
   * This is important because the Messages menu is a notification
   * surface, not the complete conversation history.
   *
   * Once the user clicks a conversation, ChatStore clears that
   * conversation's unread count. This computed signal therefore
   * immediately removes the conversation from the menu.
   */
  readonly messageConversations =
    computed(() =>
      this.chatStore
        .conversations()
        .filter(
          (conversation) =>
            this.getUnreadCount(
              conversation,
            ) > 0,
        ),
    );


  // =============================================================
  // TOTAL UNREAD CHAT MESSAGES
  // =============================================================

  /**
   * Total unread messages across all conversations
   * for the currently authenticated user.
   */
  readonly unreadChatCount =
    computed(() => {

      const userId =
        this.currentUserId();

      if (!userId) {
        return 0;
      }


      return this.chatStore
        .conversations()
        .reduce(
          (
            total,
            conversation,
          ) =>
            total +
            (
              conversation
                .unreadCounts?.[
                userId
              ] ?? 0
            ),
          0,
        );
    });


  // =============================================================
  // INITIALIZATION
  // =============================================================

  ngOnInit(): void {

    void this.store.loadInitialData();


    this.loadNotifications();


    this.loadChatConversations();
  }


  constructor() {

    this.pageTitleService.setTitle(
      'Community',
    );
  }


  // =============================================================
  // LOAD NOTIFICATIONS
  // =============================================================

  private loadNotifications(): void {

    const currentUserId =
      this.currentUserId();


    if (!currentUserId) {
      return;
    }


    void this.notificationStore
      .loadNotifications(
        currentUserId,
        50,
      );
  }


  // =============================================================
  // LOAD CHAT CONVERSATIONS
  // =============================================================

  private loadChatConversations(): void {

    const currentUserId =
      this.currentUserId();


    if (!currentUserId) {
      return;
    }


    void this.chatStore
      .loadConversations();
  }


  // =============================================================
  // CURRENT USER
  // =============================================================

  currentUserId(): string | null {

    return (
      this.authService
        .user()
        ?.id ??
      this.authService
        .firebaseUser()
        ?.uid ??
      null
    );
  }


  // =============================================================
  // CHAT STATE
  // =============================================================

  hasUnreadChats(): boolean {

    return (
      this.unreadChatCount() > 0
    );
  }


  // =============================================================
  // OTHER PARTICIPANT
  // =============================================================

  getOtherParticipant(
    conversation: ChatConversation,
  ): ChatParticipant | null {

    const currentUserId =
      this.currentUserId();


    if (
      !conversation.participantInfo ||
      conversation.participantInfo.length === 0
    ) {
      return null;
    }


    return (
      conversation
        .participantInfo
        .find(
          (participant) =>
            participant.userId !==
            currentUserId,
        ) ??
      conversation
        .participantInfo[0] ??
      null
    );
  }


  // =============================================================
  // CONVERSATION UNREAD COUNT
  // =============================================================

  getUnreadCount(
    conversation: ChatConversation,
  ): number {

    const currentUserId =
      this.currentUserId();


    if (!currentUserId) {
      return 0;
    }


    return (
      conversation
        .unreadCounts?.[
          currentUserId
        ] ?? 0
    );
  }


  // =============================================================
  // LATEST MESSAGE
  // =============================================================

  getLatestMessage(
    conversation: ChatConversation,
  ): string {

    const message =
      conversation.lastMessage?.trim();


    if (!message) {
      return 'New message';
    }


    const currentUserId =
      this.currentUserId();


    if (
      conversation.lastMessageSenderId ===
      currentUserId
    ) {

      return `You: ${message}`;
    }


    return message;
  }


  // =============================================================
  // INITIALS
  // =============================================================

  getInitials(
    displayName:
      string | null | undefined,
  ): string {

    if (!displayName) {
      return '?';
    }


    const parts =
      displayName
        .trim()
        .split(/\s+/)
        .filter(Boolean);


    if (parts.length === 0) {
      return '?';
    }


    if (parts.length === 1) {

      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }


    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }


  // =============================================================
  // FORMAT CHAT DATE
  // =============================================================

  formatChatDate(
    value: unknown,
  ): string {

    if (!value) {
      return '';
    }


    let date: Date | null = null;


    // ===========================================================
    // FIRESTORE TIMESTAMP
    // ===========================================================

    if (
      typeof value === 'object' &&
      value !== null &&
      'toDate' in value &&
      typeof (
        value as {
          toDate?: unknown;
        }
      ).toDate === 'function'
    ) {

      date = (
        value as {
          toDate: () => Date;
        }
      ).toDate();
    }


    // ===========================================================
    // DATE
    // ===========================================================

    else if (
      value instanceof Date
    ) {

      date = value;
    }


    if (!date) {
      return '';
    }


    const now =
      new Date();


    const difference =
      now.getTime() -
      date.getTime();


    const minute =
      60 * 1000;


    const hour =
      60 * minute;


    const day =
      24 * hour;


    // ===========================================================
    // LESS THAN ONE MINUTE
    // ===========================================================

    if (
      difference < minute
    ) {

      return 'now';
    }


    // ===========================================================
    // LESS THAN ONE HOUR
    // ===========================================================

    if (
      difference < hour
    ) {

      return `${Math.floor(
        difference / minute,
      )}m`;
    }


    // ===========================================================
    // LESS THAN ONE DAY
    // ===========================================================

    if (
      difference < day
    ) {

      return `${Math.floor(
        difference / hour,
      )}h`;
    }


    // ===========================================================
    // TODAY
    // ===========================================================

    if (
      date.toDateString() ===
      now.toDateString()
    ) {

      return date.toLocaleTimeString(
        [],
        {
          hour: 'numeric',
          minute: '2-digit',
        },
      );
    }


    // ===========================================================
    // OLDER
    // ===========================================================

    return date.toLocaleDateString(
      [],
      {
        month: 'short',
        day: 'numeric',
      },
    );
  }


  // =============================================================
  // OPEN CHAT CONVERSATION
  // =============================================================

  async openChatConversation(
    conversationId: string,
  ): Promise<void> {

    const id =
      conversationId.trim();


    if (!id) {
      return;
    }


    /*
     * Open the conversation through the shared root ChatStore.
     *
     * The updated ChatStore automatically clears the selected
     * conversation's notification/unread state.
     *
     * Because messageConversations() only returns conversations
     * with unreadCount > 0, the selected chat name disappears
     * from this menu immediately.
     */

    await this.chatStore
      .openConversation(id);


    /*
     * Explicitly mark the notification as read as well.
     *
     * This is safe even though openConversation() also performs
     * the operation because the store operation is idempotent.
     */

    this.chatStore
      .markConversationAsRead(id);


    /*
     * Navigate only after the conversation has been opened.
     */

    await this.router.navigate([
      '/community/chat',
    ]);
  }


  // =============================================================
  // OPEN ALL MESSAGES
  // =============================================================

  openAllMessages(): void {

    void this.router.navigate(
      [
        '/community/chat',
      ],
    );
  }


  // =============================================================
  // NOTIFICATION STATE
  // =============================================================

  hasUnreadNotifications(): boolean {

    return this.notificationStore
      .hasUnread();
  }


  unreadNotificationCount(): number {

    return this.notificationStore
      .unreadCount();
  }


  // =============================================================
  // POST COMPOSER
  // =============================================================

  openPostComposer(): void {

    this.dialog.open(
      CommunityPostComposerComponent,
      {
        width: '100%',

        maxWidth: '680px',

        maxHeight: '90vh',

        autoFocus: false,

        panelClass:
          'community-post-dialog',
      },
    );
  }


  // =============================================================
  // CLEAR TOPIC
  // =============================================================

  async clearTopic(): Promise<void> {

    await this.store.selectTopic(
      null,
    );
  }
}