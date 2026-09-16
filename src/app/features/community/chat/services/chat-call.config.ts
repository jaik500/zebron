import { Injectable } from '@angular/core';

export interface ChatCallIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatCallConfigService {
  readonly iceServers: RTCIceServer[] = [
    {
      urls: 'stun:stun.l.google.com:19302',
    },

    /*
     * Add your TURN server configuration here when available.
     *
     * Example:
     *
     * {
     *   urls: [
     *     'turn:your-turn-server.example.com:3478',
     *     'turns:your-turn-server.example.com:5349',
     *   ],
     *   username: 'TURN_USERNAME',
     *   credential: 'TURN_CREDENTIAL',
     * }
     *
     * Do not commit production TURN credentials to source control.
     */
  ];
}