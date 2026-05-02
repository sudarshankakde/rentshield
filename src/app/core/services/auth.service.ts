import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { routeModules } from './route-definitions';
import { RentShieldApiService } from '../api/rentshield-api.service';
import { UiConfigService } from './ui-config.service';
import { assertObject, readString } from '../api/request-validation';

export type UserRole = 'TENANT' | 'LANDLORD' | 'BROKER' | 'EXPERT' | 'SUPPORT' | 'ADMIN';
export type LoginMode = 'PASSWORD' | 'REGISTER';
export type BackendUserRole =
  | 'TENANT'
  | 'LANDLORD'
  | 'SERVICE_PROVIDER'
  | 'SOCIETY_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'SUPPORT_AGENT';

export interface LoginDetails {
  name: string;
  email: string;
  role: UserRole;
  token?: string;
  mode?: LoginMode;
}

export interface RegisterDetails {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

interface SessionSnapshot extends LoginDetails {
  preAuthToken?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(RentShieldApiService);
  private readonly uiConfig = inject(UiConfigService);
  private readonly storageKey = 'rentshield.session';

  private readonly restoredSession = this.restoreSession();

  private readonly _role = signal<UserRole>(this.restoredSession?.role ?? 'TENANT');
  readonly role = this._role.asReadonly();

  private readonly _user = signal<LoginDetails | null>(
    this.restoredSession
      ? {
          name: this.restoredSession.name,
          email: this.restoredSession.email,
          role: this.restoredSession.role,
          token: this.restoredSession.token,
          mode: this.restoredSession.mode,
        }
      : null,
  );
  readonly user = this._user.asReadonly();

  private readonly _token = signal<string | null>(this.restoredSession?.token ?? null);
  readonly token = this._token.asReadonly();

  private readonly _capabilities = signal<any>(null);
  readonly capabilities = this._capabilities.asReadonly();

  private readonly _preAuthToken = signal<string | null>(this.restoredSession?.preAuthToken ?? null);
  readonly preAuthToken = this._preAuthToken.asReadonly();

  private readonly _isAuthenticated = signal<boolean>(Boolean(this.restoredSession));
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  private readonly _is2faVerified = signal<boolean>(Boolean(this.restoredSession?.token));
  readonly is2faVerified = this._is2faVerified.asReadonly();

  readonly isAdmin = computed(() => this._role() === 'ADMIN' && this._is2faVerified());
  readonly isLandlord = computed(() => this._role() === 'LANDLORD' && this._is2faVerified());
  readonly isBroker = computed(() => this._role() === 'BROKER' && this._is2faVerified());
  readonly isExpert = computed(() => this._role() === 'EXPERT' && this._is2faVerified());
  readonly isSupport = computed(() => this._role() === 'SUPPORT' && this._is2faVerified());

  readonly allowedRoutes = computed(() =>
    routeModules.filter((module) => module.roles.includes(this._role())).map((module) => module.path),
  );

  roleLabel(role = this._role()) {
    const labels: Record<UserRole, string> = {
      TENANT: 'Tenant',
      LANDLORD: 'Landlord',
      BROKER: 'Broker',
      EXPERT: 'Expert',
      SUPPORT: 'Support',
      ADMIN: 'Admin',
    };
    return labels[role] ?? 'User';
  }

  isAuthorized(routePath: string) {
    const path = routePath.replace(/^\//, '');
    return path === '' || this.allowedRoutes().includes(path);
  }

  async loginWithPassword(email: string, password: string): Promise<{ requiresTwoFactor: boolean }> {
    const response = await firstValueFrom(this.api.auth.login({ email, password }));
    const parsed = this.parseAuthPayload(response);

    const finalToken = parsed.accessToken ?? parsed.token;
    if (finalToken) {
      this.applySession(
        {
          name: parsed.name || email.split('@')[0] || 'RentShield User',
          email: parsed.email || email,
          role: this.mapBackendRoleToUiRole(parsed.backendRole),
          token: finalToken,
          mode: 'PASSWORD',
        },
        null,
      );
      this.uiConfig.applyFromAuthPayload(response);
      return { requiresTwoFactor: false };
    }

    if (parsed.preAuthToken) {
      this.applySession(
        {
          name: parsed.name || email.split('@')[0] || 'RentShield User',
          email: parsed.email || email,
          role: this.mapBackendRoleToUiRole(parsed.backendRole),
          mode: 'PASSWORD',
        },
        parsed.preAuthToken,
      );
      return { requiresTwoFactor: true };
    }

    throw new Error('Login response did not contain an auth token.');
  }

  async register(details: RegisterDetails): Promise<void> {
    const response = await firstValueFrom(
      this.api.auth.register({
        email: details.email,
        password: details.password,
        firstName: details.firstName,
        lastName: details.lastName,
        role: this.mapUiRoleToBackendRole(details.role),
      }),
    );

    const parsed = this.parseAuthPayload(response);
    const token = parsed.accessToken ?? parsed.token;
    if (!token) {
      throw new Error('Registration succeeded but no token was returned.');
    }

    this.applySession(
      {
        name: parsed.name || `${details.firstName} ${details.lastName}`.trim(),
        email: parsed.email || details.email,
        role: this.mapBackendRoleToUiRole(parsed.backendRole) || details.role,
        token,
        mode: 'REGISTER',
      },
      null,
    );

    this.uiConfig.applyFromAuthPayload(response);
  }

  verify2fa(otp: string): boolean {
    if (!this._isAuthenticated()) {
      return false;
    }

    if (otp === '123456') {
      this._is2faVerified.set(true);
      this.persistSession();
      return true;
    }

    return false;
  }

  async verify2faRemote(code: string): Promise<boolean> {
    if (!this._isAuthenticated()) {
      return false;
    }

    const preToken = this._preAuthToken();
    if (!preToken) {
      return this.verify2fa(code);
    }

    const response = await firstValueFrom(this.api.auth.verify2fa({ code }, preToken));
    const parsed = this.parseAuthPayload(response);
    const accessToken = parsed.accessToken ?? parsed.token;

    if (!accessToken) {
      return false;
    }

    const current = this._user();
    if (!current) {
      return false;
    }

    this.applySession(
      {
        ...current,
        token: accessToken,
        name: parsed.name || current.name,
        email: parsed.email || current.email,
        role: this.mapBackendRoleToUiRole(parsed.backendRole),
      },
      null,
    );

    this.uiConfig.applyFromAuthPayload(response);
    return true;
  }

  setRole(role: UserRole): void {
    this._role.set(role);
    const current = this._user();
    if (!current) {
      return;
    }

    this._user.set({ ...current, role });
    this.persistSession();
  }

  updateUser(details: Partial<Pick<LoginDetails, 'name' | 'email'>>): void {
    const current = this._user();
    if (!current) {
      return;
    }

    this._user.set({ ...current, ...details });
    this.persistSession();
  }

  logout(): void {
    this._isAuthenticated.set(false);
    this._is2faVerified.set(false);
    this._user.set(null);
    this._token.set(null);
    this._preAuthToken.set(null);
    localStorage.removeItem(this.storageKey);
    this.uiConfig.clear();
  }

  async loadUiConfig(): Promise<void> {
    if (this._isAuthenticated()) {
      await this.uiConfig.load();
      await this.loadCapabilities();
    }
  }

  async loadCapabilities(): Promise<void> {
    if (!this._isAuthenticated()) return;
    try {
      const caps = await firstValueFrom(this.api.auth.capabilities());
      this._capabilities.set(caps);
    } catch (e) {
      console.error('Failed to load capabilities', e);
    }
  }

  reset2fa(): void {
    this._is2faVerified.set(false);
    this.persistSession();
  }

  private applySession(user: LoginDetails, preAuthToken: string | null): void {
    this._role.set(user.role);
    this._user.set(user);
    this._token.set(user.token ?? null);
    this._preAuthToken.set(preAuthToken);
    this._isAuthenticated.set(true);
    this._is2faVerified.set(Boolean(user.token));
    this.persistSession();
  }

  private persistSession(): void {
    const current = this._user();
    if (!current) {
      localStorage.removeItem(this.storageKey);
      return;
    }

    const snapshot: SessionSnapshot = {
      ...current,
      token: this._token() ?? undefined,
      preAuthToken: this._preAuthToken() ?? undefined,
    };

    localStorage.setItem(this.storageKey, JSON.stringify(snapshot));
  }

  private restoreSession(): SessionSnapshot | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SessionSnapshot>;

      const role = this.ensureRole(parsed.role);
      const name = typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : 'RentShield User';
      const email = typeof parsed.email === 'string' && parsed.email.trim() ? parsed.email : 'user@rentshield.local';

      if (!parsed.token && !parsed.preAuthToken) {
        localStorage.removeItem(this.storageKey);
        return null;
      }

      return {
        name,
        email,
        role,
        mode: parsed.mode,
        token: typeof parsed.token === 'string' ? parsed.token : undefined,
        preAuthToken: typeof parsed.preAuthToken === 'string' ? parsed.preAuthToken : undefined,
      };
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }

  private ensureRole(role: unknown): UserRole {
    const validRoles: UserRole[] = ['TENANT', 'LANDLORD', 'BROKER', 'EXPERT', 'SUPPORT', 'ADMIN'];
    if (typeof role === 'string' && validRoles.includes(role as UserRole)) {
      return role as UserRole;
    }
    return 'TENANT';
  }

  private parseAuthPayload(payload: unknown): {
    token?: string;
    accessToken?: string;
    preAuthToken?: string;
    name?: string;
    email?: string;
    backendRole?: BackendUserRole;
  } {
    assertObject(payload, 'auth response');
    const rawUser = payload['user'];
    const user = rawUser && typeof rawUser === 'object' ? (rawUser as Record<string, unknown>) : null;

    const firstName = readString(user?.['firstName']) || readString(payload['firstName']);
    const lastName = readString(user?.['lastName']) || readString(payload['lastName']);
    const name = `${firstName} ${lastName}`.trim() || readString(payload['name']);
    const email = readString(user?.['email']) || readString(payload['email']);
    const backendRoleRaw = readString(user?.['role']) || readString(payload['role']);

    return {
      token: readString(payload['token']) || undefined,
      accessToken: readString(payload['accessToken']) || undefined,
      preAuthToken: readString(payload['preAuthToken']) || readString(payload['tempToken']) || undefined,
      name: name || undefined,
      email: email || undefined,
      backendRole: backendRoleRaw ? (backendRoleRaw as BackendUserRole) : undefined,
    };
  }

  private mapUiRoleToBackendRole(role: UserRole): BackendUserRole {
    switch (role) {
      case 'TENANT':
        return 'TENANT';
      case 'LANDLORD':
        return 'LANDLORD';
      case 'SUPPORT':
        return 'SUPPORT_AGENT';
      case 'ADMIN':
        return 'PLATFORM_ADMIN';
      case 'BROKER':
      case 'EXPERT':
      default:
        return 'SERVICE_PROVIDER';
    }
  }

  private mapBackendRoleToUiRole(role?: BackendUserRole): UserRole {
    switch (role) {
      case 'TENANT':
        return 'TENANT';
      case 'LANDLORD':
        return 'LANDLORD';
      case 'SUPPORT_AGENT':
        return 'SUPPORT';
      case 'PLATFORM_ADMIN':
      case 'SOCIETY_ADMIN':
        return 'ADMIN';
      case 'SERVICE_PROVIDER':
        return 'BROKER';
      default:
        return 'TENANT';
    }
  }
}
