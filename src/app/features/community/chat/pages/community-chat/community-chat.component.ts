import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {
  MatDialog,
} from '@angular/material/dialog';

import {
  MatIconModule,
} from '@angular/material/icon';

import {
  ChatListComponent,
} from '../../components/chat-list/chat-list.component';

import {
  ChatWindowComponent,
} from '../../components/chat-window/chat-window.component';

import {
  NewConversationDialogComponent,
} from '../../components/new-conversation-dialog/new-conversation-dialog.component';

import {
  ChatStore,
} from '../../store/chat.store';

import {
  CommunityUser,
} from '../../../models/community-user.model';

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

      <!-- PAGE HEADER -->
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

      <!-- CHAT WORKSPACE -->
      <section
        class="grid min-h-0 flex-1 overflow-hidden rounded-xl border bg-white shadow-sm md:grid-cols-[300px_minmax(0,1fr)]"
      >

        <!-- CONVERSATION LIST -->
        <aside
          class="hidden min-h-0 border-r md:block"
        >
          <app-chat-list
            (newConversation)="openNewConversation()"
          />
        </aside>

        <!-- CHAT WINDOW -->
        <div
          class="min-h-0"
        >
          <app-chat-window />
        </div>

      </section>

    </main>
  `,
})
export class CommunityChatComponent
  implements OnInit, OnDestroy {

  private readonly chatStore =
    inject(ChatStore);

  private readonly dialog =
    inject(MatDialog);

  ngOnInit(): void {

    void this.chatStore
      .loadConversations();

  }

  openNewConversation(): void {

    const dialogRef =
      this.dialog.open(
        NewConversationDialogComponent,
        {
          width: 'calc(100vw - 32px)',
          maxWidth: '480px',
          maxHeight: '90vh',
          autoFocus: false,
          panelClass: 'zebron-new-conversation-dialog',
        },
      );

    dialogRef
      .afterClosed()
      .subscribe(
        (
          member:
            | CommunityUser
            | undefined,
        ) => {

          if (!member) {
            return;
          }

          void this.startConversation(member);

        },
      );
  }

  private async startConversation(
    member: CommunityUser,
  ): Promise<void> {

    const participant = {
      userId: member.id,
      displayName:
        member.displayName ||
        'Zebron Community Member',
      photoUrl:
        member.photoUrl ??
        undefined,
    };

    await this.chatStore
      .startDirectConversation(
        participant,
      );
  }

  ngOnDestroy(): void {

    this.chatStore
      .clear();

  }
}
