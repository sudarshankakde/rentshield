import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowRight } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { ModuleService } from '../../core/services/module.service';
import { UiConfigService } from '../../core/services/ui-config.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto space-y-8 pb-12">
      <section class="relative overflow-hidden rounded-2xl bg-surface border border-muted p-8 shadow-md">
        <!-- Hero Background -->
        <div class="absolute inset-0 z-0">
          <img src="/assets/dashboard_hero.png" alt="Dashboard Hero" class="w-full h-full object-cover opacity-20 dark:opacity-40 mix-blend-overlay">
          <div class="absolute inset-0 bg-gradient-to-r from-surface via-surface/90 to-transparent"></div>
        </div>

        <div class="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-2xl">
            <p class="text-xs uppercase tracking-[0.28em] text-brand font-black drop-shadow-sm">Home</p>
            <h1 class="mt-5 text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-brand-primary via-brand-accent to-brand-secondary">
              Your dashboard for {{ roleLabel }}
            </h1>
            <p class="mt-4 text-muted-var leading-7 text-lg max-w-xl">Each module below is a self-contained workflow. Tap the card for the feature your role should use today.</p>
          </div>
          <div class="backdrop-blur-md bg-surface-alpha border border-white/20 p-6 rounded-xl shadow-lg">
            <p class="text-[10px] uppercase tracking-[0.28em] text-muted-var font-black">Current role</p>
            <p class="mt-3 text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-secondary to-brand-primary-light">{{ roleLabel }}</p>
            <p class="mt-2 text-sm text-muted-var font-medium">Signed in as <span class="text-text font-bold">{{ auth.user()?.name || 'User' }}</span></p>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Loading State -->
        <ng-container *ngIf="uiConfig.loading()">
          <div *ngFor="let i of [1,2,3,4,5,6]" class="h-48 bg-surface-soft border border-muted animate-pulse"></div>
        </ng-container>

        <!-- Ready State -->
        <ng-container *ngIf="!uiConfig.loading()">
          <ng-container *ngIf="roleModules().length; else emptyState">
            <a *ngFor="let module of roleModules()" [routerLink]="['/', module.path]"
               class="group relative overflow-hidden rounded-xl border border-muted bg-surface p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-brand/50">
              
              <!-- Subtle hover gradient background -->
              <div class="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div class="relative z-10 flex items-center justify-between gap-3">
                <div class="w-12 h-12 flex items-center justify-center rounded-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" [ngClass]="module.color">
                  <lucide-icon [name]="module.icon" size="22"></lucide-icon>
                </div>
                <span class="text-[10px] font-black uppercase tracking-[0.28em] text-muted-var">Module</span>
              </div>
              <h2 class="relative z-10 mt-5 text-xl font-black group-hover:text-brand transition-colors">{{ module.name }}</h2>
              <p class="relative z-10 mt-2 text-sm leading-6 text-muted-var">{{ module.description }}</p>
              <div class="relative z-10 mt-5 flex items-center justify-between border-t border-muted pt-4 transition-colors group-hover:border-brand/30">
                <span class="text-xs uppercase text-brand font-black opacity-80 group-hover:opacity-100">Open Module</span>
                <lucide-icon [name]="ArrowIcon" size="16" class="text-brand transform transition-transform duration-300 group-hover:translate-x-1"></lucide-icon>
              </div>
            </a>
          </ng-container>
          <ng-template #emptyState>
            <div class="lg:col-span-3 border border-muted bg-surface-soft p-12 text-center">
              <p class="text-sm uppercase tracking-[0.28em] text-muted-var font-black">No active modules</p>
              <h2 class="mt-4 text-2xl font-black">Your role has no visible modules yet.</h2>
              <p class="mt-3 text-sm leading-6 text-muted-var">Check back after an admin activates the right workflows.</p>
            </div>
          </ng-template>
        </ng-container>
      </section>

      <section class="bg-brand-dark text-on-brand p-8 shadow-sm">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-xs uppercase tracking-[0.28em] opacity-50 font-black">Active modules</p>
            <h2 class="mt-3 text-2xl font-black">{{ roleModules().length }} module{{ roleModules().length === 1 ? '' : 's' }} available</h2>
            <p class="mt-2 text-sm opacity-70 max-w-2xl">Modules are controlled by platform admins. Only active modules assigned to your role are shown.</p>
          </div>
          <div class="border border-white/20 px-5 py-4 text-sm font-black uppercase tracking-[0.3em] opacity-70">
            {{ auth.role() }}
          </div>
        </div>
      </section>
    </div>
  `
})
export class DashboardComponent {
  auth = inject(AuthService);
  uiConfig = inject(UiConfigService);
  private moduleService = inject(ModuleService);

  readonly ArrowIcon = ArrowRight;

  roleModules = computed(() =>
    this.moduleService.activeModules().filter(m => m.roles.includes(this.auth.role()))
  );

  get roleLabel() {
    return this.auth.roleLabel(this.auth.role());
  }
}
