import {
  Injectable,
  inject,
  signal,
} from '@angular/core';

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';

import { firestore } from '../../../../core/services/firebase-config';
import { AuthService } from '../../../../core/services/auth.service';
import { LoggerService } from '../../../../core/services/logger.service';

import {
  ChatCall,
  ChatCallStatus,
  ChatCallType,
} from '../models/chat-call.model';

@Injectable({
  providedIn: 'root',
})
export class ChatCallService {
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly db = getFirestore();

  readonly state = signal<
    'idle' | 'outgoing' | 'incoming' | 'connecting' | 'connected'
  >('idle');

  readonly activeCall = signal<ChatCall | null>(null);
  readonly incomingCall = signal<ChatCall | null>(null);

  readonly localStream = signal<MediaStream | null>(null);
  readonly remoteStream = signal<MediaStream | null>(null);

  readonly muted = signal(false);

  private peerConnection: RTCPeerConnection | null = null;

  private callSubscription: Unsubscribe | null = null;
  private candidateSubscription: Unsubscribe | null = null;
  private incomingSubscription: Unsubscribe | null = null;

  private pendingCandidates: RTCIceCandidateInit[] = [];
  private processedCandidateIds = new Set<string>();

  private ringingTimer: ReturnType<typeof setTimeout> | null = null;

  /*
   * Gives WebRTC time to recover from transient connection
   * problems instead of immediately killing the call.
   */
  private connectionFailureTimer: ReturnType<
    typeof setTimeout
  > | null = null;

  /*
   * Prevents cleanup -> peerConnection.close() ->
   * connectionstatechange('closed') -> endCall() recursion.
   */
  private cleaningUp = false;

  constructor() {
    this.startIncomingCallListener();
  }

  // ============================================================
  // OUTGOING VOICE CALL
  // ============================================================

  async startVoiceCall(
    conversationId: string,
    calleeId: string,
  ): Promise<void> {
    await this.startCall(
      conversationId,
      calleeId,
      'voice',
    );
  }

  // ============================================================
  // OUTGOING VIDEO CALL
  // ============================================================

  async startVideoCall(
    conversationId: string,
    calleeId: string,
  ): Promise<void> {
    await this.startCall(
      conversationId,
      calleeId,
      'video',
    );
  }

  // ============================================================
  // START OUTGOING CALL
  // ============================================================

  private async startCall(
    conversationId: string,
    calleeId: string,
    type: ChatCallType,
  ): Promise<void> {
    const callerId = this.currentUserId();

    if (!callerId) {
      throw new Error(
        'You must be signed in to start a call.',
      );
    }

    if (
      !conversationId ||
      !calleeId ||
      callerId === calleeId
    ) {
      return;
    }

    if (this.state() !== 'idle') {
      return;
    }

    await this.prepareLocalMedia(type);

    this.state.set('outgoing');

    try {
      const callReference = await addDoc(
        collection(
          firestore,
          'communityChatCalls',
        ),
        {
          conversationId,
          callerId,
          calleeId,
          type,
          status: 'ringing' as ChatCallStatus,
          offer: null,
          answer: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      );

      const callId = callReference.id;

      await this.createPeerConnection(callId);

      if (!this.peerConnection) {
        throw new Error(
          'Unable to create the call peer connection.',
        );
      }

      const offer =
        await this.peerConnection.createOffer();

      await this.peerConnection.setLocalDescription(
        offer,
      );

      await updateDoc(
        callReference,
        {
          offer: {
            type: offer.type,
            sdp: offer.sdp,
          },
          updatedAt: serverTimestamp(),
        },
      );

      this.watchCall(callId);
      this.startRingingTimeout(callId);

      this.logger.info(
        'ChatCallService',
        `Outgoing community ${type} call started.`,
        {
          callId,
          conversationId,
          callerId,
          calleeId,
          type,
        },
      );
    } catch (error) {
      await this.cleanup(false);

      this.logger.error(
        'ChatCallService',
        `Failed to start outgoing community ${type} call.`,
        this.errorContext(error),
      );

      throw error;
    }
  }

  // ============================================================
  // ACCEPT INCOMING CALL
  // ============================================================

  async acceptIncomingCall(): Promise<void> {
    const incoming = this.incomingCall();

    if (!incoming) {
      return;
    }

    this.incomingCall.set(null);
    this.state.set('connecting');

    try {
      const call =
        await this.waitForIncomingCallOffer(
          incoming.id,
        );

      if (!call) {
        throw new Error(
          'The incoming call offer was not available.',
        );
      }

      await this.prepareLocalMedia(call.type);

      if (!call.offer) {
        throw new Error(
          'The incoming call offer is missing.',
        );
      }

      await this.createPeerConnection(call.id);

      if (!this.peerConnection) {
        throw new Error(
          'Unable to create the incoming call peer connection.',
        );
      }

      await this.peerConnection.setRemoteDescription(
        call.offer,
      );

      await this.flushPendingCandidates();

      const localAnswer =
        await this.peerConnection.createAnswer();

      await this.peerConnection.setLocalDescription(
        localAnswer,
      );

      await updateDoc(
        doc(
          firestore,
          'communityChatCalls',
          call.id,
        ),
        {
          status: 'accepted' as ChatCallStatus,
          answer: {
            type: localAnswer.type,
            sdp: localAnswer.sdp,
          },
          updatedAt: serverTimestamp(),
        },
      );

      this.activeCall.set({
        ...call,
        status: 'accepted',
        answer: localAnswer,
      });

      this.clearRingingTimer();

      this.watchCall(call.id);

      this.logger.info(
        'ChatCallService',
        `Incoming community ${call.type} call accepted.`,
        {
          callId: call.id,
          conversationId: call.conversationId,
          type: call.type,
        },
      );
    } catch (error) {
      await this.cleanup(false);

      this.logger.error(
        'ChatCallService',
        'Failed to accept incoming community call.',
        this.errorContext(error),
      );

      throw error;
    }
  }

  // ============================================================
  // WAIT FOR OFFER
  // ============================================================

  private async waitForIncomingCallOffer(
    callId: string,
  ): Promise<ChatCall | null> {
    const maxAttempts = 10;
    const delayMs = 500;

    for (
      let attempt = 0;
      attempt < maxAttempts;
      attempt++
    ) {
      const snapshot = await getDoc(
        doc(
          firestore,
          'communityChatCalls',
          callId,
        ),
      );

      if (!snapshot.exists()) {
        return null;
      }

      const call = this.mapCall(
        snapshot.id,
        snapshot.data(),
      );

      if (call.offer) {
        return call;
      }

      if (attempt < maxAttempts - 1) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, delayMs);
        });
      }
    }

    return null;
  }

  // ============================================================
  // DECLINE
  // ============================================================

  async declineIncomingCall(): Promise<void> {
    const call = this.incomingCall();

    if (!call) {
      return;
    }

    try {
      await updateDoc(
        doc(
          firestore,
          'communityChatCalls',
          call.id,
        ),
        {
          status: 'declined' as ChatCallStatus,
          updatedAt: serverTimestamp(),
        },
      );
    } catch (error) {
      this.logger.error(
        'ChatCallService',
        'Failed to decline incoming community call.',
        this.errorContext(error),
      );
    } finally {
      await this.cleanup(true);
    }
  }

  // ============================================================
  // END CALL
  // ============================================================

  async endCall(): Promise<void> {
    if (this.cleaningUp) {
      return;
    }

    const call = this.activeCall();

    if (call) {
      try {
        await updateDoc(
          doc(
            firestore,
            'communityChatCalls',
            call.id,
          ),
          {
            status: 'ended' as ChatCallStatus,
            updatedAt: serverTimestamp(),
          },
        );
      } catch (error) {
        this.logger.error(
          'ChatCallService',
          'Failed to update ended community call.',
          this.errorContext(error),
        );
      }
    }

    await this.cleanup(true);
  }

  // ============================================================
  // MUTE / UNMUTE
  // ============================================================

  toggleMute(): void {
    const stream = this.localStream();

    if (!stream) {
      return;
    }

    const nextMuted = !this.muted();

    for (const track of stream.getAudioTracks()) {
      track.enabled = !nextMuted;
    }

    this.muted.set(nextMuted);
  }

  // ============================================================
  // DESTROY
  // ============================================================

  async destroy(): Promise<void> {
    this.incomingSubscription?.();
    this.incomingSubscription = null;

    await this.cleanup(false);
  }

  // ============================================================
  // WEBRTC PEER CONNECTION
  // ============================================================

  private async createPeerConnection(
    callId: string,
  ): Promise<void> {
    this.clearConnectionFailureTimer();

    this.peerConnection?.close();

    this.peerConnection =
      new RTCPeerConnection({
        iceServers: [
          {
            urls: 'stun:stun.l.google.com:19302',
          },
        ],
      });

    const localStream = this.localStream();

    if (localStream) {
      for (const track of localStream.getTracks()) {
        this.peerConnection.addTrack(
          track,
          localStream,
        );
      }
    }

    this.peerConnection.ontrack = (event) => {
      const [stream] = event.streams;

      if (!stream) {
        return;
      }

      this.remoteStream.set(stream);
    };

    this.peerConnection.onicecandidate = async (
      event,
    ) => {
      if (!event.candidate) {
        return;
      }

      try {
        await addDoc(
          collection(
            firestore,
            'communityChatCalls',
            callId,
            'candidates',
          ),
          {
            senderId: this.currentUserId(),
            candidate:
              event.candidate.toJSON(),
            createdAt: serverTimestamp(),
          },
        );
      } catch (error) {
        this.logger.error(
          'ChatCallService',
          'Failed to store WebRTC ICE candidate.',
          this.errorContext(error),
        );
      }
    };

    this.peerConnection.onconnectionstatechange =
      () => {
        if (this.cleaningUp) {
          return;
        }

        const connectionState =
          this.peerConnection?.connectionState;

        switch (connectionState) {
          case 'connected':
            this.clearConnectionFailureTimer();
            this.clearRingingTimer();

            this.state.set('connected');

            {
              const currentCall =
                this.activeCall();

              if (currentCall) {
                this.activeCall.set({
                  ...currentCall,
                  status: 'connected',
                });
              }
            }

            this.logger.info(
              'ChatCallService',
              'WebRTC community call connected.',
              {
                callId,
              },
            );

            break;

          case 'disconnected':
            /*
             * Do not end the call immediately.
             * Browsers can temporarily report "disconnected"
             * during network changes.
             */
            this.startConnectionRecoveryTimer(
              callId,
            );
            break;

          case 'failed':
            /*
             * Give ICE a short recovery window before ending
             * the call.
             */
            this.startConnectionRecoveryTimer(
              callId,
            );
            break;

          case 'closed':
            /*
             * closed is normally caused by intentional cleanup.
             * Do not call endCall() here.
             */
            break;
        }
      };

    /*
     * ICE state gives us additional visibility into connectivity.
     * We deliberately do not terminate the call directly from
     * this event because connectionState is the lifecycle source.
     */
    this.peerConnection.oniceconnectionstatechange =
      () => {
        if (this.cleaningUp) {
          return;
        }

        const iceState =
          this.peerConnection
            ?.iceConnectionState;

        this.logger.debug(
          'ChatCallService',
          'Community call ICE state changed.',
          {
            callId,
            iceState,
          },
        );
      };
  }

  // ============================================================
  // CONNECTION RECOVERY TIMER
  // ============================================================

  private startConnectionRecoveryTimer(
    callId: string,
  ): void {
    this.clearConnectionFailureTimer();

    this.connectionFailureTimer =
      setTimeout(async () => {
        if (this.cleaningUp) {
          return;
        }

        const connectionState =
          this.peerConnection?.connectionState;

        if (
          connectionState === 'connected'
        ) {
          this.clearConnectionFailureTimer();
          return;
        }

        if (
          connectionState !== 'failed' &&
          connectionState !==
            'disconnected'
        ) {
          return;
        }

        this.logger.warn?.(
          'ChatCallService',
          'Community call connection did not recover.',
          {
            callId,
            connectionState,
          },
        );

        await this.endCall();
      }, 10000);
  }

  // ============================================================
  // CLEAR CONNECTION RECOVERY TIMER
  // ============================================================

  private clearConnectionFailureTimer(): void {
    if (this.connectionFailureTimer) {
      clearTimeout(
        this.connectionFailureTimer,
      );

      this.connectionFailureTimer = null;
    }
  }

  // ============================================================
  // WATCH CALL DOCUMENT
  // ============================================================

  private watchCall(callId: string): void {
    this.callSubscription?.();
    this.candidateSubscription?.();

    this.callSubscription = null;
    this.candidateSubscription = null;

    const callReference = doc(
      firestore,
      'communityChatCalls',
      callId,
    );

    this.callSubscription = onSnapshot(
      callReference,
      async (snapshot) => {
        if (!snapshot.exists()) {
          await this.cleanup(false);
          return;
        }

        const call = this.mapCall(
          snapshot.id,
          snapshot.data(),
        );

        this.activeCall.set(call);

        if (
          call.status === 'ended' ||
          call.status === 'declined' ||
          call.status === 'missed'
        ) {
          await this.cleanup(false);
          return;
        }

        const localUserId =
          this.currentUserId();

        if (
          call.callerId === localUserId &&
          call.answer &&
          this.peerConnection &&
          !this.peerConnection
            .currentRemoteDescription
        ) {
          await this.peerConnection.setRemoteDescription(
            call.answer,
          );

          await this.flushPendingCandidates();
        }
      },
      (error) => {
        this.logger.error(
          'ChatCallService',
          'Active community call listener failed.',
          this.errorContext(error),
        );
      },
    );

    this.candidateSubscription = onSnapshot(
      collection(
        firestore,
        'communityChatCalls',
        callId,
        'candidates',
      ),
      async (snapshot) => {
        for (const change of snapshot.docChanges()) {
          if (change.type === 'removed') {
            continue;
          }

          if (
            this.processedCandidateIds.has(
              change.doc.id,
            )
          ) {
            continue;
          }

          this.processedCandidateIds.add(
            change.doc.id,
          );

          const data =
            change.doc.data();

          if (
            data['senderId'] ===
            this.currentUserId()
          ) {
            continue;
          }

          const candidate =
            data['candidate'] as
              | RTCIceCandidateInit
              | undefined;

          if (!candidate) {
            continue;
          }

          try {
            if (
              this.peerConnection
                ?.remoteDescription
            ) {
              await this.peerConnection.addIceCandidate(
                candidate,
              );
            } else {
              this.pendingCandidates.push(
                candidate,
              );
            }
          } catch (error) {
            this.logger.error(
              'ChatCallService',
              'Failed to apply WebRTC ICE candidate.',
              this.errorContext(error),
            );
          }
        }
      },
      (error) => {
        this.logger.error(
          'ChatCallService',
          'Community call candidate listener failed.',
          this.errorContext(error),
        );
      },
    );
  }

  // ============================================================
  // MEDIA
  // ============================================================

  private async prepareLocalMedia(
    type: ChatCallType,
  ): Promise<void> {
    if (this.localStream()) {
      return;
    }

    if (
      !navigator.mediaDevices?.getUserMedia
    ) {
      throw new Error(
        type === 'video'
          ? 'Camera and microphone access are not available in this browser.'
          : 'Microphone access is not available in this browser.',
      );
    }

    const stream =
      await navigator.mediaDevices.getUserMedia(
        {
          audio: true,
          video: type === 'video',
        },
      );

    this.localStream.set(stream);
    this.muted.set(false);
  }

  // ============================================================
  // FLUSH ICE CANDIDATES
  // ============================================================

  private async flushPendingCandidates(): Promise<void> {
    if (
      !this.peerConnection
        ?.remoteDescription
    ) {
      return;
    }

    const queued = [
      ...this.pendingCandidates,
    ];

    this.pendingCandidates = [];

    for (const candidate of queued) {
      try {
        await this.peerConnection.addIceCandidate(
          candidate,
        );
      } catch (error) {
        this.logger.error(
          'ChatCallService',
          'Failed to flush pending WebRTC ICE candidate.',
          this.errorContext(error),
        );
      }
    }
  }

  // ============================================================
  // INCOMING CALL LISTENER
  // ============================================================

  private startIncomingCallListener(): void {
    const userId = this.currentUserId();

    if (!userId) {
      setTimeout(
        () =>
          this.startIncomingCallListener(),
        500,
      );

      return;
    }

    this.incomingSubscription?.();

    const incomingQuery = query(
      collection(
        firestore,
        'communityChatCalls',
      ),
      where(
        'calleeId',
        '==',
        userId,
      ),
      where(
        'status',
        '==',
        'ringing',
      ),
    );

    this.incomingSubscription =
      onSnapshot(
        incomingQuery,
        (snapshot) => {
          const calls = snapshot.docs
            .map((item) =>
              this.mapCall(
                item.id,
                item.data(),
              ),
            )
            .filter((call) =>
              Boolean(call.offer),
            );

          if (
            calls.length === 0 ||
            this.state() !== 'idle'
          ) {
            return;
          }

          const call = calls[0];

          this.incomingCall.set(call);
          this.activeCall.set(call);
          this.state.set('incoming');

          this.startRingingTimeout(
            call.id,
          );
        },
        (error) => {
          this.logger.error(
            'ChatCallService',
            'Incoming community call listener failed.',
            this.errorContext(error),
          );

          this.incomingSubscription =
            null;

          setTimeout(
            () =>
              this.startIncomingCallListener(),
            2000,
          );
        },
      );
  }

  // ============================================================
  // RINGING TIMEOUT
  // ============================================================

  private startRingingTimeout(
    callId: string,
  ): void {
    this.clearRingingTimer();

    this.ringingTimer =
      setTimeout(
        async () => {
          try {
            const snapshot =
              await getDoc(
                doc(
                  firestore,
                  'communityChatCalls',
                  callId,
                ),
              );

            if (!snapshot.exists()) {
              return;
            }

            const call = this.mapCall(
              snapshot.id,
              snapshot.data(),
            );

            /*
             * Important:
             * only timeout calls that are still ringing.
             */
            if (call.status !== 'ringing') {
              this.clearRingingTimer();
              return;
            }

            await updateDoc(
              snapshot.ref,
              {
                status:
                  'missed' as ChatCallStatus,
                updatedAt:
                  serverTimestamp(),
              },
            );

            await this.cleanup(true);
          } catch (error) {
            this.logger.error(
              'ChatCallService',
              'Failed to process community call timeout.',
              this.errorContext(error),
            );
          }
        },
        30000,
      );
  }

  // ============================================================
  // CLEAR RINGING TIMER
  // ============================================================

  private clearRingingTimer(): void {
    if (this.ringingTimer) {
      clearTimeout(
        this.ringingTimer,
      );

      this.ringingTimer = null;
    }
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  private async cleanup(
    clearIncoming: boolean,
  ): Promise<void> {
    if (this.cleaningUp) {
      return;
    }

    this.cleaningUp = true;

    try {
      this.clearRingingTimer();
      this.clearConnectionFailureTimer();

      this.callSubscription?.();
      this.candidateSubscription?.();

      this.callSubscription = null;
      this.candidateSubscription = null;

      const peerConnection =
        this.peerConnection;

      /*
       * Detach handlers BEFORE closing the peer connection.
       * This prevents "closed" from triggering another endCall().
       */
      if (peerConnection) {
        peerConnection.ontrack = null;
        peerConnection.onicecandidate =
          null;
        peerConnection.onconnectionstatechange =
          null;
        peerConnection.oniceconnectionstatechange =
          null;

        peerConnection.close();
      }

      this.peerConnection = null;

      const localStream =
        this.localStream();

      if (localStream) {
        for (const track of localStream.getTracks()) {
          track.stop();
        }
      }

      this.localStream.set(null);
      this.remoteStream.set(null);

      this.activeCall.set(null);

      this.pendingCandidates = [];
      this.processedCandidateIds.clear();

      this.muted.set(false);

      if (clearIncoming) {
        this.incomingCall.set(null);
      }

      this.state.set('idle');
    } finally {
      this.cleaningUp = false;
    }
  }

  // ============================================================
  // CURRENT USER
  // ============================================================

  private currentUserId(): string | null {
    return this.authService.user()?.id ?? null;
  }

  // ============================================================
  // MAP CALL
  // ============================================================

  private mapCall(
    id: string,
    data: DocumentData,
  ): ChatCall {
    return {
      id,
      conversationId: String(
        data['conversationId'] ?? '',
      ),
      callerId: String(
        data['callerId'] ?? '',
      ),
      calleeId: String(
        data['calleeId'] ?? '',
      ),
      type:
        data['type'] === 'video'
          ? 'video'
          : 'voice',
      status:
        this.normalizeCallStatus(
          data['status'],
        ),
      offer:
        data['offer'] ?? null,
      answer:
        data['answer'] ?? null,
      createdAt:
        data['createdAt'] ?? null,
      updatedAt:
        data['updatedAt'] ?? null,
    };
  }

  // ============================================================
  // NORMALIZE STATUS
  // ============================================================

  private normalizeCallStatus(
    value: unknown,
  ): ChatCallStatus {
    switch (value) {
      case 'ringing':
      case 'accepted':
      case 'connected':
      case 'declined':
      case 'missed':
      case 'ended':
        return value;

      default:
        return 'ringing';
    }
  }

  // ============================================================
  // ERROR CONTEXT
  // ============================================================

  private errorContext(
    error: unknown,
  ): Record<string, unknown> {
    return {
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }
}