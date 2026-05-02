import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RentShieldApiService } from '../api/rentshield-api.service';
import { ToastService } from './toast.service';
import { createRequestState } from './request-state.service';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

export interface ActiveModule {
  /** The slug/id matching the frontend route path, e.g. "property", "finance" */
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface UiConfig {
  navigation: NavItem[];
  activeModules: ActiveModule[];
}

@Injectable({ providedIn: 'root' })
export class UiConfigService {
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);
  private readonly requestState = createRequestState<unknown>(null);

  /** Raw navigation from backend */
  private _navigation = signal<NavItem[]>([]);
  navigation = this._navigation.asReadonly();

  /** Raw active module list from backend — contains { id, name } objects */
  private _activeModules = signal<ActiveModule[]>([]);
  activeModules = this._activeModules.asReadonly();

  /**
   * True after the backend has responded at least once.
   * Until then, treat as "loading" and show nothing.
   */
  private _isLoaded = signal(false);
  isLoaded = this._isLoaded.asReadonly();

  /** Shared request state to keep UX consistent */
  loading = this.requestState.loading;
  error = this.requestState.error;
  success = this.requestState.success;

  /**
   * Set of active module slugs (id field) for fast O(1) lookup.
   * Backend sends both `id` (slug) and `name` for each active module.
   */
  activeModuleIds = computed(() =>
    new Set(
      this._activeModules().map(m =>
        (m['id'] ?? m['name'] ?? '').toString().toLowerCase().trim()
      )
    )
  );

  /**
   * Whether a given module slug is active per backend config.
   *
   * STRICT MODE:
   * - If backend has not yet responded → false (show nothing yet)
   * - If backend has responded but list is empty → false (no access)
   * - If backend has responded and slug is in list → true
   */
  isModuleActive(slug: string): boolean {
    if (!this._isLoaded()) return false;
    return this.activeModuleIds().has(slug.toLowerCase().trim());
  }

  /**
   * Called once after successful login / on app boot when session exists.
   * Fetches /auth/profile which returns uiConfig: { navigation, activeModules }.
   */
  async load(): Promise<void> {
    if (this.loading()) return;

    const response = await this.requestState.runPromise(firstValueFrom(this.api.auth.profile()), {
      errorMessage: 'Could not load UI config from server.',
      preserveSuccess: true,
    });

    if (!response) {
      // Non-fatal — mark as loaded with empty list (access denied until re-login)
      this._isLoaded.set(true);
      this.toast.warning(this.error() ?? 'Could not load UI config from server.');
      return;
    }

    this.apply(response);
  }

  /**
   * Apply a uiConfig payload directly (e.g. from login / 2FA response).
   * This avoids a second round-trip when the response already contains uiConfig.
   */
  applyFromAuthPayload(payload: unknown): void {
    if (payload && typeof payload === 'object') {
      this.apply(payload as Record<string, unknown>);
    }
  }

  /** Reset on logout */
  clear(): void {
    this._navigation.set([]);
    this._activeModules.set([]);
    this._isLoaded.set(false);
  }

  // ── private ────────────────────────────────────────────────────────────────

  private apply(response: unknown): void {
    if (!response || typeof response !== 'object') return;

    const raw = response as Record<string, unknown>;
    const uiConfig = raw['uiConfig'];

    if (!uiConfig || typeof uiConfig !== 'object') return;

    const cfg = uiConfig as Record<string, unknown>;

    const nav = Array.isArray(cfg['navigation']) ? cfg['navigation'] : [];
    const mods = Array.isArray(cfg['activeModules']) ? cfg['activeModules'] : [];

    this._navigation.set(
      nav
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        .map(item => ({
          label: String(item['label'] ?? ''),
          route: String(item['route'] ?? '/'),
          icon: String(item['icon'] ?? ''),
        }))
    );

    // Normalise each module entry to always have both id and name.
    // Backend may send strings (old format) or { id, name } objects (new format).
    this._activeModules.set(
      mods.map(m => {
        if (typeof m === 'string') {
          return { id: m.toLowerCase(), name: m };
        }
        const obj = m as Record<string, unknown>;
        const id = String(obj['id'] ?? obj['name'] ?? '').toLowerCase();
        const name = String(obj['name'] ?? obj['id'] ?? '');
        return { ...obj, id, name };
      })
    );

    // Mark as loaded only after successfully parsing a response
    this._isLoaded.set(true);
  }
}
