import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ShieldCheck } from 'lucide-angular';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <main class="auth-shell min-h-screen grid lg:grid-cols-[1fr_520px] bg-bg relative">
      <!-- Background Elements -->
      <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-primary/20 blur-[120px]"></div>
        <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-secondary/20 blur-[150px]"></div>
      </div>

      <section class="hidden lg:flex flex-col justify-between p-16 text-white relative overflow-hidden m-4 rounded-[2.5rem] shadow-2xl">
        <!-- Hero Background Image -->
        <div class="absolute inset-0 z-0">
          <img src="/assets/dashboard_hero.png" alt="Auth Hero" class="w-full h-full object-cover mix-blend-overlay opacity-50 transition-transform duration-[20s] hover:scale-110">
          <div class="absolute inset-0 bg-gradient-to-br from-[#0b1220]/90 via-[#0b1220]/60 to-transparent"></div>
        </div>

        <div class="relative z-10 flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
            <lucide-icon [name]="ShieldIcon" size="24" class="text-brand-accent"></lucide-icon>
          </div>
          <span class="text-2xl font-black tracking-tight drop-shadow-md">RentShield</span>
        </div>

        <div class="relative z-10 max-w-xl">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
            <span class="w-2 h-2 rounded-full bg-brand-secondary animate-pulse"></span>
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Enterprise Grade Platform</span>
          </div>
          <h1 class="text-5xl font-black tracking-tight leading-[1.1] mb-6 drop-shadow-lg bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-white/60">
            Secure access for every tenancy workflow.
          </h1>
          <p class="text-white/80 text-lg font-medium leading-relaxed max-w-md backdrop-blur-sm bg-black/10 p-4 rounded-2xl border border-white/5">
            Manage KYC, payments, agreements, support, disputes, and society operations from one trusted platform.
          </p>
        </div>

        <div class="relative z-10 flex items-center justify-between">
          <p class="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">
            End-to-end encrypted authentication
          </p>
          <div class="flex gap-2">
            <div class="w-1.5 h-1.5 rounded-full bg-white/30"></div>
            <div class="w-1.5 h-1.5 rounded-full bg-white/30"></div>
            <div class="w-4 h-1.5 rounded-full bg-brand-accent"></div>
          </div>
        </div>
      </section>

      <section class="flex flex-col justify-center px-6 py-12 lg:px-12 relative z-10">
        <div class="w-full max-w-[420px] mx-auto">
          <div class="flex items-center gap-3 mb-10 lg:hidden">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-dark text-white flex items-center justify-center shadow-lg">
              <lucide-icon [name]="ShieldIcon" size="20"></lucide-icon>
            </div>
            <span class="text-2xl font-black tracking-tight">RentShield</span>
          </div>

          <header class="mb-8">
            <h2 class="text-3xl leading-[1.1] font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-text to-text-soft">{{ title }}</h2>
            <p class="text-text-muted text-sm mt-3 font-medium leading-relaxed">{{ subtitle }}</p>
          </header>

          <section class="auth-card backdrop-blur-xl bg-surface/80 border border-border/50 shadow-2xl rounded-3xl p-8 relative overflow-hidden transition-all duration-300 hover:shadow-brand/20">
            <div class="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 pointer-events-none"></div>
            <div class="relative z-10">
              <ng-content></ng-content>
            </div>
          </section>

          <div class="mt-8">
            <ng-content select="[layout-footer]"></ng-content>
          </div>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host { display: block; }

    .auth-shell {
      background: var(--bg);
    }

    .auth-card {
      box-shadow: var(--shadow-md);
    }
  `],
})
export class AuthLayoutComponent {
  @Input() title = '';
  @Input() subtitle = '';

  readonly ShieldIcon = ShieldCheck;
}
