import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import {
  ChatConversation,
} from '../../models/chat-conversation.model';

import {
  ChatStore,
} from '../../store/chat.store';


@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection:
    ChangeDetectionStrategy.OnPush,

  template: `

    <section
      class="flex h-full flex-col bg-white"
    >

      <!-- ======================================================
           HEADER
           ====================================================== -->

      <header
        class="flex items-center justify-between border-b px-4 py-3"
      >

        <div>
          <h2
            class="text-base font-semibold text-gray-900"
          >
            Messages
          </h2>

          <p
            class="text-xs text-gray-500"
          >
            Your conversations
          </p>
        </div>

        <button
          mat-icon-button
          type="button"
          aria-label="Start a new conversation"
          matTooltip="New conversation"
          (click)="newConversation.emit()"
        >
          <mat-icon>
            edit
          </mat-icon>
        </button>

      </header>


      <!-- ======================================================
           LOADING
           ====================================================== -->

      @if (store.loading()) {

        <div
          class="flex flex-1 items-center justify-center px-4"
        >

          <div
            class="text-sm text-gray-500"
          >
            Loading conversations...
          </div>

        </div>

      }


      <!-- ======================================================
           ERROR
           ====================================================== -->

      @else if (store.error()) {

        <div
          class="m-4 rounded-lg border border-red-200 bg-red-50 p-3"
        >

          <div
            class="text-sm text-red-700"
          >
            {{ store.error() }}
          </div>

        </div>

      }


      <!-- ======================================================
           EMPTY
           ====================================================== -->

      @else if (store.isEmpty()) {

        <div
          class="flex flex-1 flex-col items-center justify-center px-6 text-center"
        >

          <mat-icon
            class="mb-3 !h-10 !w-10 !text-[40px] text-gray-400"
          >
            chat_bubble_outline
          </mat-icon>

          <h3
            class="text-sm font-semibold text-gray-800"
          >
            No conversations yet
          </h3>

          <p
            class="mt-1 text-xs text-gray-500"
          >
            Start a conversation with someone
            in the Zebron community.
          </p>

          <button
            mat-stroked-button
            type="button"
            class="mt-4"
            (click)="newConversation.emit()"
          >
            <mat-icon>
              add
            </mat-icon>

            New conversation
          </button>

        </div>

      }


      <!-- ======================================================
           CONVERSATIONS
           ====================================================== -->

      @else {

        <div
          class="flex-1 overflow-y-auto"
        >

          @for (
            conversation of store.conversations();
            track conversation.id
          ) {

            <button
              type="button"
              class="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition hover:bg-gray-50"
              [class.bg-gray-100]="
                store.activeConversationId() ===
                conversation.id
              "
              (click)="selectConversation(conversation)"
            >

              <!-- AVATAR -->

              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200"
              >

               @if (
  otherParticipant(conversation).photoUrl
) {

  <img
    class="h-full w-full object-cover"
    [src]="
      otherParticipant(conversation).photoUrl
    "
    alt=""
  />

} @else {

                  <mat-icon
                    class="text-gray-500"
                  >
                    person
                  </mat-icon>

                }

              </div>


              <!-- CONTENT -->

              <div
                class="min-w-0 flex-1"
              >

                <div
                  class="truncate text-sm font-medium text-gray-900"
                >
                {{
  otherParticipant(conversation)
    .displayName ||
  'Zebron Community Member'
}}
                </div>

                <div
                  class="mt-0.5 truncate text-xs text-gray-500"
                >
                  {{
                    conversation.lastMessage ||
                    'Start a conversation'
                  }}
                </div>

              </div>

            </button>

          }

        </div>

      }

    </section>
  `,

})
export class ChatListComponent {

  readonly store =
    inject(ChatStore);


  readonly newConversation =
    output<void>();


  otherParticipant(
    conversation: ChatConversation,
  ) {

    const user =
      this.store.currentUser();


    return (
      conversation.participantInfo
        ?.find(
          (participant) =>
            participant.userId !==
            user?.id,
        ) ??
      conversation.participantInfo?.[0] ??
      null
    );
  }


  selectConversation(
    conversation: ChatConversation,
  ): void {

    void this.store
      .openConversation(
        conversation.id,
      );
  }
}
