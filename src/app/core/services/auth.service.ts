import { Injectable, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { routeModules } from './route-definitions';
import { RentShieldApiService } from '../api/rentshield-api.service';
import { UiConfigService } from './ui-config.service';
import { assertObject, readString } from '../api/request-validation';

export type UserRole = 'TENANT' | 'LANDLORD' | 'BROKER' | 'EXPERT' | 'SUPPORT' | 'PLATFORM_ADMIN' | 'SOCIETY_ADMIN' | 'SUPPORT_AGENT';
export type LoginMode = 'PASSWORD' | 'REGISTER';
export type BackendUserRole =
  | 'TENANT'
  | 'LANDLORD'
  | 'SERVICE_PROVIDER'
  | 'SOCIETY_ADMIN'
  | 'PLATFORM_ADMIN'
  | 'SUPPORT_AGENT';

export interface LoginDetails {
  id: string;
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
          id: this.restoredSession.id,
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

  readonly isAdmin = computed(() => (this._role() === 'PLATFORM_ADMIN' || this._role() === 'SOCIETY_ADMIN') && this._is2faVerified());
  readonly isLandlord = computed(() => this._role() === 'LANDLORD' && this._is2faVerified());
  readonly isBroker = computed(() => this._role() === 'BROKER' && this._is2faVerified());
  readonly isExpert = computed(() => (this._role() === 'EXPERT' || this._role() === 'BROKER') && this._is2faVerified());
  readonly isSupport = computed(() => (this._role() === 'SUPPORT' || this._role() === 'SUPPORT_AGENT') && this._is2faVerified());
  readonly isSuperAdmin = computed(() => this._role() === 'PLATFORM_ADMIN');

  readonly allowedRoutes = computed(() =>
    routeModules.filter((module) => module.roles.includes(this._role())).map((module) => module.path),
  );

  roleLabel(role = this._role()) {
    const labels: Record<string, string> = {
      TENANT: 'Tenant',
      LANDLORD: 'Landlord',
      BROKER: 'Service Provider',
      EXPERT: 'Expert',
      SUPPORT: 'Support',
      PLATFORM_ADMIN: 'Super Admin',
      SOCIETY_ADMIN: 'Society Admin',
      SUPPORT_AGENT: 'Support Agent',
      SERVICE_PROVIDER: 'Service Provider'
    };
    return labels[role] ?? 'User';
  }

  isAuthorized(routePath: string) {
    const path = routePath.replace(/^\//, '');
    return path === '' || this.allowedRoutes().includes(path);
  }

  hasCapability(key: string): boolean {
    const caps = this._capabilities();
    if (!caps) return true; // Fallback to allowed if not loaded yet or legacy

    // Check modules
    if (Array.isArray(caps.modules) && caps.modules.some((m: string) => m.toLowerCase() === key.toLowerCase())) {
      return true;
    }

    // Check features
    if (Array.isArray(caps.features) && caps.features.some((f: string) => f.toLowerCase() === key.toLowerCase())) {
      return true;
    }

    // Legacy "can" check
    if (caps.can && typeof caps.can === 'object' && caps.can[key] === true) {
      return true;
    }

    return false;
  }

  async loginWithPassword(email: string, password: string): Promise<{ requiresTwoFactor: boolean }> {
    const response = await firstValueFrom(this.api.auth.login({ email, password }));
    const parsed = this.parseAuthPayload(response);

    const finalToken = parsed.accessToken ?? parsed.token;
    if (finalToken) {
      this.applySession(
        {
          id: parsed.id || '',
          name: parsed.name || email.split('@')[0] || 'RentShield User',
          email: parsed.email || email,
          role: this.mapBackendRoleToUiRole(parsed.backendRole),
          token: finalToken,
          mode: 'PASSWORD',
        },
        null,
      );
      
      // Apply capabilities if present
      if (response && typeof response === 'object' && (response as any).capabilities) {
        this._capabilities.set((response as any).capabilities);
      }

      this.uiConfig.applyFromAuthPayload(response);
      return { requiresTwoFactor: false };
    }

    if (parsed.preAuthToken) {
      this.applySession(
        {
          id: parsed.id || '',
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
        id: parsed.id || '',
        name: parsed.name || `${details.firstName} ${details.lastName}`.trim(),
        email: parsed.email || details.email,
        role: this.mapBackendRoleToUiRole(parsed.backendRole) || details.role,
        token,
        mode: 'REGISTER',
      },
      null,
    );

    // Apply capabilities if present
    if (response && typeof response === 'object' && (response as any).capabilities) {
      this._capabilities.set((response as any).capabilities);
    }

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
        id: parsed.id || current.id,
        token: accessToken,
        name: parsed.name || current.name,
        email: parsed.email || current.email,
        role: this.mapBackendRoleToUiRole(parsed.backendRole),
      },
      null,
    );

    // Apply capabilities if present
    if (response && typeof response === 'object' && (response as any).capabilities) {
      this._capabilities.set((response as any).capabilities);
    }

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
    this._user.set({ ...user });
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

    const snapshot: SessionSnapshot & { capabilities?: any } = {
      ...current,
      token: this._token() ?? undefined,
      preAuthToken: this._preAuthToken() ?? undefined,
      capabilities: this._capabilities() ?? undefined,
    };

    localStorage.setItem(this.storageKey, JSON.stringify(snapshot));
  }

  private restoreSession(): SessionSnapshot | null {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<SessionSnapshot & { capabilities?: any }>;

      const role = this.ensureRole(parsed.role);
      const id = typeof parsed.id === 'string' ? parsed.id : '';
      const name = typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name : 'RentShield User';
      const email = typeof parsed.email === 'string' && parsed.email.trim() ? parsed.email : 'user@rentshield.local';

      if (!parsed.token && !parsed.preAuthToken) {
        localStorage.removeItem(this.storageKey);
        return null;
      }

      if (parsed.capabilities) {
        this._capabilities.set(parsed.capabilities);
      }

      return {
        id,
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
    const validRoles: string[] = ['TENANT', 'LANDLORD', 'BROKER', 'EXPERT', 'SUPPORT', 'PLATFORM_ADMIN', 'SOCIETY_ADMIN', 'SUPPORT_AGENT', 'SERVICE_PROVIDER'];
    if (typeof role === 'string' && validRoles.includes(role)) {
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
    id?: string;
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
      id: readString(user?.['id']) || readString(payload['id']) || undefined,
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
      case 'PLATFORM_ADMIN':
        return 'PLATFORM_ADMIN';
      case 'BROKER':
      case 'EXPERT':
      default:
        return 'SERVICE_PROVIDER';
    }
  }

  private mapBackendRoleToUiRole(role?: BackendUserRole): UserRole {
    if (!role) return 'TENANT';
    // We now support backend roles directly in the UI roles
    return role as UserRole;
  }
}
