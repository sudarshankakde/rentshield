import { Injectable, computed, inject, signal } from '@angular/core';
import { Search, Shield, FileText, User, Hammer, Wallet, MessageSquare, AlertTriangle, HelpCircle, LayoutGrid, Users, Settings, Bell } from 'lucide-angular';
import { UserRole } from './auth.service';
import { RentShieldApiService } from '../api/rentshield-api.service';
import { ToastService } from './toast.service';
import { UiConfigService } from './ui-config.service';
import { assertObject, readArray, readBoolean, readString } from '../api/request-validation';
import { createRequestState } from './request-state.service';

export interface AppModule {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  isActive: boolean;
  path: string;
  roles: UserRole[];
}

@Injectable({ providedIn: 'root' })
export class ModuleService {
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);
  private readonly uiConfigService = inject(UiConfigService);
  private readonly requestState = createRequestState<unknown>(null);

  loading = this.requestState.loading;
  error = this.requestState.error;
  success = this.requestState.success;

  // Centralized state for turning modules ON/OFF
  // All entries have a live backend API. 'notifications' removed — no backend module.
  modules = signal<AppModule[]>([
    { id: 'property', name: 'Properties', description: 'Browse and manage listings', icon: Search, color: 'bg-[#00a38d]', isActive: true, path: 'property', roles: ['TENANT', 'LANDLORD', 'BROKER', 'ADMIN'] },
    { id: 'tenancies', name: 'Tenancies', description: 'Track move-in and lease status', icon: Shield, color: 'bg-[#a355ff]', isActive: true, path: 'tenancies', roles: ['TENANT', 'LANDLORD'] },
    { id: 'agreements', name: 'Agreements', description: 'Draft, review, and sign contracts', icon: FileText, color: 'bg-[#ff6d00]', isActive: true, path: 'agreements', roles: ['TENANT', 'LANDLORD', 'BROKER', 'ADMIN'] },
    { id: 'experts', name: 'Experts', description: 'Connect with service specialists', icon: User, color: 'bg-[#4361ee]', isActive: true, path: 'experts', roles: ['BROKER', 'EXPERT', 'TENANT', 'ADMIN'] },
    { id: 'maintenance', name: 'Maintenance', description: 'Raise and review repair requests', icon: Hammer, color: 'bg-[#3a86ff]', isActive: true, path: 'maintenance', roles: ['TENANT', 'LANDLORD', 'SUPPORT', 'ADMIN'] },
    { id: 'finance', name: 'Payments', description: 'Manage bills and invoices', icon: Wallet, color: 'bg-[#06d6a0]', isActive: true, path: 'finance', roles: ['TENANT', 'LANDLORD', 'ADMIN'] },
    { id: 'chat', name: 'Chat', description: 'Collaborate with your support team', icon: MessageSquare, color: 'bg-[#ff006e]', isActive: true, path: 'chat', roles: ['TENANT', 'LANDLORD', 'BROKER', 'EXPERT', 'SUPPORT', 'ADMIN'] },
    { id: 'dispute', name: 'Disputes', description: 'Resolve issues and claims', icon: AlertTriangle, color: 'bg-[#ef4444]', isActive: true, path: 'dispute', roles: ['TENANT', 'LANDLORD', 'BROKER', 'SUPPORT', 'ADMIN'] },
    { id: 'support', name: 'Support', description: 'Help center and live assistance', icon: HelpCircle, color: 'bg-[#6366f1]', isActive: true, path: 'support', roles: ['TENANT', 'LANDLORD', 'BROKER', 'EXPERT', 'SUPPORT', 'ADMIN'] },
    { id: 'notices', name: 'Notices', description: 'Community updates and bulletins', icon: LayoutGrid, color: 'bg-[#f59e0b]', isActive: true, path: 'notices', roles: ['TENANT', 'LANDLORD', 'BROKER', 'SUPPORT', 'ADMIN'] },
    { id: 'notifications', name: 'Notifications', description: 'Alerts and notification preferences', icon: Bell, color: 'bg-[#64748b]', isActive: true, path: 'notifications', roles: ['TENANT', 'LANDLORD', 'BROKER', 'EXPERT', 'SUPPORT', 'ADMIN'] },
    { id: 'kyc', name: 'KYC', description: 'Verify identity and access secure features', icon: Shield, color: 'bg-[#0f766e]', isActive: true, path: 'kyc', roles: ['TENANT', 'LANDLORD', 'BROKER', 'EXPERT', 'SUPPORT', 'ADMIN'] },
    { id: 'exit', name: 'Exit', description: 'Manage move-out workflows', icon: FileText, color: 'bg-[#f97316]', isActive: true, path: 'exit', roles: ['TENANT'] },
    { id: 'society', name: 'Society', description: 'Society dashboard and contacts', icon: Users, color: 'bg-[#ec4899]', isActive: true, path: 'society', roles: ['ADMIN'] },
    { id: 'admin', name: 'Admin Panel', description: 'Platform management and configuration', icon: LayoutGrid, color: 'bg-[#111827]', isActive: true, path: 'admin', roles: ['ADMIN'] },
    { id: 'profile', name: 'Profile', description: 'Account settings and preferences', icon: Settings, color: 'bg-[#64748b]', isActive: true, path: 'profile', roles: ['TENANT', 'LANDLORD', 'BROKER', 'EXPERT', 'SUPPORT', 'ADMIN'] },
  ]);

  /**
   * Computed list of modules the BACKEND says are active for this user.
   *
   * Rules (strict mode):
   * 1. Backend not yet responded → empty list (show loading/nothing)
   * 2. Backend responded, module slug in activeModuleIds → show it
   * 3. Backend responded, slug NOT in list → hide it
   *
   * Matching uses id, path, and lowercased name for resilience.
   */
  activeModules = computed(() => {
    // Don't show anything until the backend has confirmed what's active
    if (!this.uiConfigService.isLoaded()) return [];

    return this.modules()
      .filter(m => m.isActive)
      .filter(m =>
        this.uiConfigService.isModuleActive(m.id) ||
        this.uiConfigService.isModuleActive(m.path) ||
        this.uiConfigService.isModuleActive(m.name.toLowerCase())
      );
  });

  async loadModulesFromBackend() {
    const response = await this.requestState.runObservable(this.api.admin.listModules(), {
      errorMessage: 'Unable to sync modules from backend.',
      successMessage: 'Modules synced from backend.',
      preserveSuccess: true,
    });

    if (!response) {
      this.toast.warning(this.error() ?? 'Unable to sync modules from backend.');
      return;
    }

    const mapped = this.mapBackendModules(response);
    if (mapped.length > 0) {
      this.modules.set(mapped);
    }
  }

  modulesForRole(role: UserRole) {
    return this.modules().filter(m => m.isActive && m.roles.includes(role));
  }

  async toggleModule(id: string) {
    const module = this.modules().find((item) => item.id === id);
    if (!module) {
      return;
    }

    const nextState = !module.isActive;
    // Optimistically update local state immediately
    this.modules.update(mods => mods.map(m => m.id === id ? { ...m, isActive: nextState } : m));

    // Only persist to backend when the id is a real UUID (i.e. module was loaded from backend).
    // Local slug-based ids like 'property', 'chat' etc. are frontend-only — no DB record exists.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return;
    }

    const persisted = await this.requestState.runObservable(this.api.admin.toggleModule(id, nextState), {
      errorMessage: 'Failed to persist module state.',
      preserveSuccess: true,
    });

    if (!persisted) {
      // Roll back optimistic update on API failure
      this.modules.update(mods => mods.map(m => m.id === id ? { ...m, isActive: module.isActive } : m));
      this.toast.error(this.error() ?? 'Failed to persist module state.');
    }
  }

  private mapBackendModules(payload: unknown): AppModule[] {
    assertObject(payload, 'admin modules response');
    const rows = readArray(payload['modules']);

    return rows.map((row, index) => {
      const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      const name = readString(item['label']) || readString(item['name'], `Module ${index + 1}`);
      const slug = readString(item['name'], '').toLowerCase();
      const match = this.modules().find((module) => module.path === slug || module.id === slug);

      return {
        id: readString(item['id'], match?.id ?? `module-${index + 1}`),
        name,
        description: match?.description ?? `Backend managed module ${name}`,
        icon: match?.icon ?? LayoutGrid,
        color: match?.color ?? 'bg-[#64748b]',
        isActive: readBoolean(item['isActive'], true),
        path: match?.path ?? (slug || `module-${index + 1}`),
        roles: match?.roles ?? ['ADMIN'],
      };
    });
  }
}
