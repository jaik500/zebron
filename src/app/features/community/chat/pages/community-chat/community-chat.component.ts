import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

import {
  ChatListComponent,
} from '../../components/chat-list/chat-list.component';

import {
  ChatWindowComponent,
} from '../../components/chat-window/chat-window.component';

import {
  ChatStore,
} from '../../store/chat.store';

@Component({
  selector: 'app-community-chat',
  standalone: true,
  imports: [
    ChatListComponent,
    ChatWindowComponent,
    MatIconModule,
  ],
  changeDetection:
    ChangeDetectionStrategy.OnPush,
  template: `
    <main
      class="mx-auto flex h-[calc(100vh-64px)] max-w-7xl flex-col px-3 py-3 sm:px-4 lg:px-6"
    >
      <!-- ======================================================
           PAGE HEADER
           ====================================================== -->
      <header
        class="mb-3 flex items-center gap-3"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50"
        >
          <mat-icon
            class="text-blue-600"
          >
            forum
          </mat-icon>
        </div>

        <div>
          <h1
            class="text-xl font-semibold text-gray-900"
          >
            Community Chat
          </h1>

          <p
            class="text-sm text-gray-500"
          >
            Connect privately with members of the Zebron community.
          </p>
        </div>
      </header>

      <!-- ======================================================
           DESKTOP CHAT WORKSPACE

           Desktop keeps the existing two-column layout.
           ====================================================== -->
      <section
        class="hidden min-h-0 flex-1 overflow-hidden rounded-xl border bg-white shadow-sm md:grid md:grid-cols-[300px_minmax(0,1fr)]"
      >
        <aside
          class="min-h-0 border-r"
        >
          <app-chat-list />
        </aside>

        <div
          class="min-h-0"
        >
          <app-chat-window
            class="block h-full min-h-0"
          />
        </div>
      </section>

      <!-- ======================================================
           MOBILE CHAT

           There is intentionally no mobile side drawer here.
           The active chat's forum button opens the conversation
           list as a popup menu over the chat, matching the
           requested Messages/Chats interaction.
           ====================================================== -->
      <section
        class="min-h-0 flex-1 overflow-hidden rounded-xl border bg-white shadow-sm md:hidden"
      >
        @if (chatStore.activeConversation()) {
          <app-chat-window
            class="block h-full min-h-0"
          />
        } @else {
          <app-chat-list />
        }
      </section>
    </main>
  `,
})
export class CommunityChatComponent
  implements OnInit, OnDestroy {

  readonly chatStore =
    inject(ChatStore);

  ngOnInit(): void {
    void this.chatStore
      .loadConversations();
  }

  ngOnDestroy(): void {
    this.chatStore.clear();
  }
}
