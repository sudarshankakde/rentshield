import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ShieldCheck } from 'lucide-angular';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <main class="auth-shell min-h-screen grid lg:grid-cols-[1fr_520px]">
      <section class="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden">
        <div class="hero-glow hero-glow--1"></div>
        <div class="hero-glow hero-glow--2"></div>

        <div class="relative z-10 flex items-center gap-3">
          <div class="w-10 h-10 bg-white/12 border border-white/20 flex items-center justify-center">
            <lucide-icon [name]="ShieldIcon" size="20"></lucide-icon>
          </div>
          <span class="text-lg font-black tracking-tight">RentShield</span>
        </div>

        <div class="relative z-10 max-w-lg">
          <p class="text-white/60 font-bold text-[10px] uppercase tracking-[0.3em] mb-4">Rental lifecycle super app</p>
          <h1 class="text-[2.5rem] font-black tracking-tight leading-[1.1]">
            Secure access for every tenancy workflow.
          </h1>
          <p class="text-white/70 mt-5 text-sm font-medium leading-relaxed">
            Manage KYC, payments, agreements, support, disputes, and society operations from one trusted platform.
          </p>
        </div>

        <p class="relative z-10 text-white/35 text-[10px] font-bold uppercase tracking-widest">
          End-to-end encrypted authentication
        </p>
      </section>

      <section class="bg-surface flex items-center justify-center px-5 py-10 lg:px-10">
        <div class="w-full max-w-110">
          <div class="flex items-center gap-2.5 mb-8 lg:hidden">
            <div class="w-9 h-9 bg-brand-dark text-on-brand flex items-center justify-center">
              <lucide-icon [name]="ShieldIcon" size="18"></lucide-icon>
            </div>
            <span class="text-base font-black tracking-tight">RentShield</span>
          </div>

          <header class="mb-6">
            <h2 class="text-[1.9rem] leading-[1.1] font-black tracking-tight">{{ title }}</h2>
            <p class="text-muted-var text-sm mt-2">{{ subtitle }}</p>
          </header>

          <section class="auth-card">
            <ng-content></ng-content>
          </section>

          <ng-content select="[layout-footer]"></ng-content>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host { display: block; }

    .auth-shell {
      background:
        radial-gradient(circle at 14% 10%, rgba(11, 69, 200, 0.28), transparent 40%),
        radial-gradient(circle at 78% 24%, rgba(8, 193, 90, 0.22), transparent 36%),
        linear-gradient(130deg, #07143c 0%, #0d2b69 42%, #123472 100%);
    }

    .hero-glow {
      position: absolute;
      width: 280px;
      height: 280px;
      border-radius: 999px;
      filter: blur(16px);
      opacity: 0.35;
    }

    .hero-glow--1 {
      background: rgba(37, 99, 235, 0.6);
      top: -120px;
      left: -100px;
    }

    .hero-glow--2 {
      background: rgba(16, 185, 129, 0.45);
      right: -120px;
      bottom: -120px;
    }

    .auth-card {
      border: 1px solid var(--border);
      background: var(--surface);
      box-shadow: var(--shadow-sm);
      padding: 1.2rem;
    }

    @media (max-width: 1023px) {
      .auth-shell { background: var(--bg); }
    }
  `],
})
export class AuthLayoutComponent {
  @Input() title = '';
  @Input() subtitle = '';

  readonly ShieldIcon = ShieldCheck;
}
