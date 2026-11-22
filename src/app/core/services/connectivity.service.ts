import { Injectable, signal } from '@angular/core';

/**
 * The device's connection, as the browser reports it (`navigator.onLine`
 * and the online / offline events). Always "online" on the server.
 *
 * "Online" only means the device has a network; a captive portal or a very
 * weak signal can still fail, so callers must still handle failed requests.
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly state = signal(typeof navigator === 'undefined' ? true : navigator.onLine);

  /** True while the device reports a connection. */
  readonly online = this.state.asReadonly();

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', () => this.state.set(true));
    window.addEventListener('offline', () => this.state.set(false));
  }
}
