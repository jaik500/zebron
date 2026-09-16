import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
} from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { ChatCallService } from '../../services/chat-call.service';

@Component({
  selector: 'app-chat-call-panel',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Incoming call overlay -->
    @if (callService.incomingCall(); as incomingCall) {
      <div
        class="fixed inset-0 z-[300] flex items-start justify-center px-4 pt-6 pointer-events-none"
      >
        <div
          class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
        >
          <div class="flex items-center gap-4 px-5 py-4">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100"
            >
              <mat-icon>
                {{
                  incomingCall.type === 'video'
                    ? 'videocam'
                    : 'call'
                }}
              </mat-icon>
            </div>

            <div class="min-w-0 flex-1">
              <div class="text-sm font-semibold text-gray-900">
                {{
                  incomingCall.type === 'video'
                    ? 'Incoming video call'
                    : 'Incoming voice call'
                }}
              </div>

              <div class="mt-0.5 text-xs text-gray-500">
                {{
                  incomingCall.type === 'video'
                    ? 'Someone is calling you'
                    : 'Someone is calling you'
                }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 border-t border-gray-100 px-5 py-4">
            <button
              mat-stroked-button
              type="button"
              class="flex-1"
              (click)="decline()"
            >
              <mat-icon>call_end</mat-icon>
              Decline
            </button>

            <button
              mat-flat-button
              type="button"
              class="flex-1"
              (click)="accept()"
            >
              <mat-icon>
                {{
                  incomingCall.type === 'video'
                    ? 'videocam'
                    : 'call'
                }}
              </mat-icon>
              Accept
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Active call -->
    @if (callService.activeCall(); as activeCall) {
      @if (activeCall.type === 'video') {
        <!-- Remote video -->
        <video
          #remoteVideo
          autoplay
          playsinline
          class="fixed inset-0 z-[201] h-full w-full bg-black object-cover"
        ></video>

        <!-- Local preview -->
        <video
          #localVideo
          autoplay
          muted
          playsinline
          class="fixed bottom-24 right-4 z-[202] h-32 w-24 rounded-xl bg-black object-cover shadow-xl ring-1 ring-white/20 sm:h-40 sm:w-28"
        ></video>

        <!-- Video call controls -->
        <div
          class="fixed bottom-4 left-1/2 z-[203] flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/70 px-4 py-3 shadow-2xl backdrop-blur"
        >
          <button
            mat-icon-button
            type="button"
            class="!text-white"
            [attr.aria-label]="
              callService.muted()
                ? 'Unmute microphone'
                : 'Mute microphone'
            "
            [attr.title]="
              callService.muted()
                ? 'Unmute microphone'
                : 'Mute microphone'
            "
            (click)="toggleMute()"
          >
            <mat-icon>
              {{
                callService.muted()
                  ? 'mic_off'
                  : 'mic'
              }}
            </mat-icon>
          </button>

          <button
            mat-icon-button
            type="button"
            class="!bg-red-600 !text-white hover:!bg-red-700"
            aria-label="End call"
            title="End call"
            (click)="end()"
          >
            <mat-icon>call_end</mat-icon>
          </button>
        </div>

        <!-- Connection status -->
        @if (callService.state() !== 'connected') {
          <div
            class="fixed left-1/2 top-6 z-[204] -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur"
          >
            @switch (callService.state()) {
              @case ('outgoing') {
                Calling…
              }

              @case ('connecting') {
                Connecting…
              }

              @default {
                Video call
              }
            }
          </div>
        }
      } @else {
        <!-- Voice call panel -->
        <div
          class="fixed bottom-4 left-1/2 z-[200] w-[calc(100%-24px)] max-w-sm -translate-x-1/2 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100"
            >
              <mat-icon>call</mat-icon>
            </div>

            <div class="min-w-0 flex-1">
              <div class="truncate text-sm font-semibold text-gray-900">
                Voice call
              </div>

              <div class="mt-0.5 text-xs text-gray-500">
                @switch (callService.state()) {
                  @case ('outgoing') {
                    Calling…
                  }

                  @case ('connecting') {
                    Connecting…
                  }

                  @case ('connected') {
                    Connected
                  }

                  @default {
                    Voice call
                  }
                }
              </div>
            </div>

            <div class="flex items-center gap-1">
              <button
                mat-icon-button
                type="button"
                [attr.aria-label]="
                  callService.muted()
                    ? 'Unmute microphone'
                    : 'Mute microphone'
                "
                [attr.title]="
                  callService.muted()
                    ? 'Unmute microphone'
                    : 'Mute microphone'
                "
                (click)="toggleMute()"
              >
                <mat-icon>
                  {{
                    callService.muted()
                      ? 'mic_off'
                      : 'mic'
                  }}
                </mat-icon>
              </button>

              <button
                mat-icon-button
                type="button"
                class="!text-red-600"
                aria-label="End call"
                title="End call"
                (click)="end()"
              >
                <mat-icon>call_end</mat-icon>
              </button>
            </div>
          </div>

          <div class="mt-3 flex items-center justify-center">
            <span
              class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
            >
              <span
                class="h-2 w-2 rounded-full"
                [class.bg-green-500]="
                  callService.state() === 'connected'
                "
                [class.bg-amber-500]="
                  callService.state() !== 'connected'
                "
              ></span>

              {{
                callService.state() === 'connected'
                  ? 'Connected'
                  : 'Connecting'
              }}
            </span>
          </div>
        </div>
      }
    }

    <!-- Audio element for voice calls -->
    <audio
      #remoteAudio
      autoplay
      playsinline
      class="hidden"
    ></audio>
  `,
})
export class ChatCallPanelComponent implements OnDestroy {
  readonly callService = inject(ChatCallService);

  @ViewChild('remoteAudio')
  private remoteAudio?: ElementRef<HTMLAudioElement>;

  @ViewChild('remoteVideo')
  private remoteVideo?: ElementRef<HTMLVideoElement>;

  @ViewChild('localVideo')
  private localVideo?: ElementRef<HTMLVideoElement>;

  private readonly remoteStreamEffect = effect(() => {
    const stream = this.callService.remoteStream();

    const audio = this.remoteAudio?.nativeElement;

    if (audio && audio.srcObject !== stream) {
      audio.srcObject = stream;
    }

    const video = this.remoteVideo?.nativeElement;

    if (video && video.srcObject !== stream) {
      video.srcObject = stream;

      void video.play().catch(() => {
        // Browser autoplay restrictions may prevent playback.
      });
    }
  });

  private readonly localStreamEffect = effect(() => {
    const stream = this.callService.localStream();

    const video = this.localVideo?.nativeElement;

    if (video && video.srcObject !== stream) {
      video.srcObject = stream;

      void video.play().catch(() => {
        // Local muted video normally autoplay succeeds.
      });
    }
  });

  async accept(): Promise<void> {
    await this.callService.acceptIncomingCall();
  }

  async decline(): Promise<void> {
    await this.callService.declineIncomingCall();
  }

  toggleMute(): void {
    this.callService.toggleMute();
  }

  async end(): Promise<void> {
    await this.callService.endCall();
  }

  ngOnDestroy(): void {
    this.remoteStreamEffect.destroy();
    this.localStreamEffect.destroy();
  }
}