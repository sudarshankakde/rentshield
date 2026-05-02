import { Component, effect, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LogOut, ShieldCheck, User, Sun, Moon } from 'lucide-angular';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { UiConfigService } from './core/services/ui-config.service';
import { ToastComponent } from './shared/components/toast/toast.component';
import { createRoutes } from './app.routes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    LucideAngularModule,
    ToastComponent,
  ],
  template: `
    <app-toast></app-toast>

    <ng-container *ngIf="!auth.isAuthenticated(); else appShell">
      <router-outlet></router-outlet>
    </ng-container>

    <ng-template #appShell>
    <div class="min-h-screen bg-base">
      <header class="sticky top-0 z-20 bg-surface-alpha backdrop-blur border-b border-muted">
        <div class="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">

          <!-- Brand -->
          <div class="flex items-center gap-2.5 shrink-0">
            <div class="w-8 h-8 bg-brand-dark text-on-brand flex items-center justify-center">
              <span style="display:inline-flex;align-items:center">
                <lucide-icon [name]="ShieldIcon" size="16"></lucide-icon>
              </span>
            </div>
            <span class="text-sm font-black tracking-tight hidden sm:block">RentShield</span>
          </div>

          <!-- Backend-driven navigation -->
          <nav class="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 px-2">
            <ng-container *ngIf="uiConfig.navigation().length > 0; else defaultNav">
              <a *ngFor="let item of uiConfig.navigation()"
                 [routerLink]="item.route"
                 routerLinkActive="nav-link--active"
                 class="nav-link">
                {{ item.label }}
              </a>
            </ng-container>
            <ng-template #defaultNav>
              <a [routerLink]="'/'"
                 routerLinkActive="nav-link--active"
                 [routerLinkActiveOptions]="{ exact: true }"
                 class="nav-link">
                Home
              </a>
            </ng-template>
          </nav>

          <!-- Right actions -->
          <div class="flex items-center gap-2 shrink-0">
            <!-- Theme toggle -->
            <button (click)="theme.toggle()" class="btn-theme w-8 h-8" title="Toggle theme">
              <span style="display:inline-flex;align-items:center">
                <lucide-icon *ngIf="theme.theme() === 'dark'" [name]="SunIcon" size="14"></lucide-icon>
                <lucide-icon *ngIf="theme.theme() !== 'dark'" [name]="MoonIcon" size="14"></lucide-icon>
              </span>
            </button>

            <!-- User -->
            <div routerLink="/profile" class="flex items-center gap-2 cursor-pointer group">
              <div class="w-8 h-8 bg-surface-soft flex items-center justify-center text-muted-var border border-muted group-hover:border-brand transition-colors">
                <span style="display:inline-flex;align-items:center">
                  <lucide-icon [name]="UserIcon" size="15"></lucide-icon>
                </span>
              </div>
              <div class="hidden md:block">
                <p class="text-[9px] font-black tracking-widest text-muted-var uppercase leading-none">{{ auth.role() }}</p>
                <p class="text-xs font-black mt-0.5 leading-none">{{ auth.user()?.name || 'User' }}</p>
              </div>
            </div>

            <!-- Logout -->
            <button (click)="auth.logout()"
                    class="w-8 h-8 border border-muted text-muted-var hover:text-danger hover:border-danger flex items-center justify-center transition-colors"
                    title="Logout">
              <span style="display:inline-flex;align-items:center">
                <lucide-icon [name]="LogoutIcon" size="15"></lucide-icon>
              </span>
            </button>
          </div>
        </div>
      </header>

      <!-- Loading bar while uiConfig loads -->
      <div *ngIf="uiConfig.loading()"
           class="h-0.5 bg-brand animate-pulse fixed top-14 left-0 right-0 z-30">
      </div>

      <main class="max-w-7xl mx-auto p-4 md:p-8">
        <router-outlet></router-outlet>
      </main>
    </div>
    </ng-template>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }

    .nav-link {
      display: inline-flex;
      align-items: center;
      height: 2rem;
      padding: 0 0.75rem;
      font-size: 0.7rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      border: 1px solid transparent;
      white-space: nowrap;
      transition: color 0.15s, border-color 0.15s, background 0.15s;
    }

    .nav-link:hover {
      color: var(--brand-primary);
      border-color: var(--brand-primary);
    }

    .nav-link--active {
      background: var(--brand-primary-dark);
      color: #fff !important;
      border-color: var(--brand-primary-dark) !important;
    }

    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  uiConfig = inject(UiConfigService);
  theme = inject(ThemeService);
  private router = inject(Router);

  readonly ShieldIcon = ShieldCheck;
  readonly UserIcon = User;
  readonly LogoutIcon = LogOut;
  readonly SunIcon = Sun;
  readonly MoonIcon = Moon;

  constructor() {
    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.router.resetConfig(createRoutes(this.auth.role()));
      } else {
        this.router.resetConfig(createRoutes(null));
        if (!this.router.url.startsWith('/auth')) {
          this.router.navigateByUrl('/auth/login');
        }
      }
    });
  }

  async ngOnInit() {
    // On app boot: if session was restored from localStorage, fetch uiConfig from server
    await this.auth.loadUiConfig();
  }
}
