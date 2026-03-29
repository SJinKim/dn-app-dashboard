import { Injectable, signal } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _kc = new Keycloak({
    url:      environment.keycloak.url,
    realm:    environment.keycloak.realm,
    clientId: environment.keycloak.clientId,
  });

  readonly isAuthenticated = signal(false);
  readonly username        = signal<string>('');
  readonly roles           = signal<string[]>([]);

  /** Call once at app startup. Returns true if authentication succeeded. */
  async init(): Promise<boolean> {
    const authenticated = await this._kc.init({
      onLoad:   'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });

    this.isAuthenticated.set(authenticated);

    if (authenticated) {
      this.username.set(this._kc.tokenParsed?.['preferred_username'] ?? '');
      this.roles.set(
        (this._kc.tokenParsed?.['realm_access'] as { roles: string[] })?.roles ?? []
      );
    }

    // Auto-refresh token 30 seconds before expiry
    setInterval(async () => {
      try {
        await this._kc.updateToken(30);
      } catch {
        this._kc.login();
      }
    }, 20_000);

    return authenticated;
  }

  getToken(): string | undefined {
    return this._kc.token;
  }

  isAdmin(): boolean {
    return this.roles().some(r => r.toLowerCase() === 'admin');
  }

  logout(): void {
    this._kc.logout({ redirectUri: window.location.origin });
  }
}
