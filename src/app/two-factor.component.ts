import { Component, inject, signal, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Lock, ArrowRight, RefreshCcw, ShieldCheck, ChevronLeft } from 'lucide-angular';
import { AuthService } from './core/services/auth.service';
import { ToastService } from './core/services/toast.service';
import { createRequestState } from './core/services/request-state.service';

@Component({
  selector: 'app-two-factor',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-base flex items-center justify-center px-4 py-8">
      <div class="w-full max-w-sm">

        <!-- Back link -->
        <button class="flex items-center gap-1.5 text-muted-var hover:text-brand transition-colors
                       text-[11px] font-bold uppercase tracking-widest mb-8 group"
                (click)="goBack()">
          <span style="display:inline-flex;align-items:center">
            <lucide-icon [name]="BackIcon" size="13" class="group-hover:-translate-x-0.5 transition-transform"></lucide-icon>
          </span>
          Back to sign in
        </button>

        <!-- Header -->
        <div class="mb-7">
          <div class="w-10 h-10 bg-brand-dark text-on-brand flex items-center justify-center mb-5">
            <span style="display:inline-flex;align-items:center">
              <lucide-icon [name]="ShieldIcon" size="18"></lucide-icon>
            </span>
          </div>
          <h1 class="text-xl font-black tracking-tight">Two-step verification</h1>
          <p class="text-muted-var text-xs font-medium mt-1.5 leading-relaxed">
            Enter the 6-digit code from your authenticator app or SMS.
          </p>
          <p class="text-brand text-[10px] font-black uppercase tracking-widest mt-2">
            Hint: 123456
          </p>
        </div>

        <!-- SKELETON while verifying -->
        <ng-container *ngIf="verifying()">
          <div class="animate-pulse space-y-4">
            <div class="flex gap-2">
              <div *ngFor="let _ of [1,2,3,4,5,6]" class="h-12 flex-1 bg-surface-strong"></div>
            </div>
            <div class="h-1 bg-surface-strong w-full"></div>
            <div class="h-10 bg-surface-strong w-full mt-2"></div>
          </div>
        </ng-container>

        <!-- OTP Form -->
        <ng-container *ngIf="!verifying()">

          <!-- Digit boxes -->
          <div class="flex gap-2 mb-3" (paste)="onPaste($event)">
            <input
              *ngFor="let i of digitIndexes; let idx = index"
              #digitInput
              type="text"
              inputmode="numeric"
              maxlength="1"
              [value]="digits()[idx]"
              (input)="onDigitInput($event, idx)"
              (keydown)="onKeyDown($event, idx)"
              (focus)="focusedIndex.set(idx)"
              (blur)="focusedIndex.set(-1)"
              class="otp-box"
              [class.otp-box--filled]="digits()[idx] !== ''"
              [class.otp-box--focus]="focusedIndex() === idx"
              [class.otp-box--error]="error()"
              autocomplete="one-time-code"
            >
          </div>

          <!-- Progress bar -->
          <div class="flex gap-1 mb-5">
            <div *ngFor="let i of digitIndexes"
                 class="h-px flex-1 transition-all duration-200"
                 [ngClass]="digits()[i] !== '' ? 'bg-brand' : 'bg-surface-strong'">
            </div>
          </div>

          <!-- Error -->
          <div *ngIf="error()"
               class="flex items-center gap-2 border border-danger/25 bg-danger/5 px-3 py-2.5 mb-4">
            <div class="w-1.5 h-1.5 bg-danger rounded-full shrink-0"></div>
            <p class="text-danger text-[11px] font-bold">Invalid code. Check and try again.</p>
          </div>

          <p class="text-[11px] font-semibold text-muted-var mb-4">{{ helperMessage() }}</p>

          <!-- Verify button -->
          <button (click)="verify()"
                  [disabled]="otpValue().length !== 6"
                  class="w-full btn-primary h-10 font-black text-xs uppercase tracking-widest
                         flex items-center justify-center gap-2 transition-opacity
                         hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed">
            <span style="display:inline-flex;align-items:center">
              <lucide-icon [name]="LockIcon" size="14"></lucide-icon>
            </span>
            Authorize Access
            <span style="display:inline-flex;align-items:center;margin-left:auto">
              <lucide-icon [name]="ArrowIcon" size="13"></lucide-icon>
            </span>
          </button>

          <!-- Resend -->
          <div class="flex items-center justify-between mt-5 pt-4 border-t border-muted">
            <p class="text-muted-var text-[11px] font-medium">Didn't get a code?</p>
            <button (click)="requestNewCode()"
                    class="flex items-center gap-1.5 text-brand text-[11px] font-black
                           uppercase tracking-widest hover:opacity-70 transition-opacity">
              <span style="display:inline-flex;align-items:center">
                <lucide-icon [name]="RefreshIcon" size="12"></lucide-icon>
              </span>
              Resend
            </button>
          </div>

        </ng-container>

        <!-- Footer -->
        <p class="text-muted-var font-bold text-[9px] uppercase tracking-widest mt-8 text-center">
          Secured by RentShield · End-to-end encrypted
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .otp-box {
      flex: 1;
      min-width: 0;
      height: 3rem;
      background: var(--bg);
      border: 1.5px solid var(--border);
      color: var(--text);
      font-size: 1.125rem;
      font-weight: 900;
      text-align: center;
      outline: none;
      transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      caret-color: transparent;
      -moz-appearance: textfield;
    }

    .otp-box::-webkit-outer-spin-button,
    .otp-box::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .otp-box--focus {
      border-color: var(--brand-primary);
      box-shadow: 0 0 0 2px rgba(11,69,200,0.1);
      background: var(--surface);
    }

    .otp-box--filled {
      background: var(--surface);
      border-color: var(--brand-primary-light);
    }

    .otp-box--error {
      border-color: var(--danger) !important;
      box-shadow: 0 0 0 2px rgba(220,38,38,0.08) !important;
    }
  `]
})
export class TwoFactorComponent implements AfterViewInit {
  auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private readonly verifyState = createRequestState<boolean>(null);

  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  readonly digitIndexes = [0, 1, 2, 3, 4, 5];

  digits = signal<string[]>(['', '', '', '', '', '']);
  focusedIndex = signal(-1);
  error = signal(false);
  verifying = this.verifyState.loading;
  requestError = this.verifyState.error;
  helperMessage = signal('Enter the latest code to complete sign-in.');

  readonly LockIcon = Lock;
  readonly ArrowIcon = ArrowRight;
  readonly RefreshIcon = RefreshCcw;
  readonly ShieldIcon = ShieldCheck;
  readonly BackIcon = ChevronLeft;

  otpValue() {
    return this.digits().join('');
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const inputs = this.digitInputs.toArray();
      if (inputs[0]) inputs[0].nativeElement.focus();
    }, 100);
  }

  onDigitInput(event: Event, idx: number) {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');
    const char = raw.slice(-1);

    const updated = [...this.digits()];
    updated[idx] = char;
    this.digits.set(updated);
    this.error.set(false);

    if (char && idx < 5) {
      const inputs = this.digitInputs.toArray();
      inputs[idx + 1]?.nativeElement.focus();
    }

    if (updated.every(d => d !== '')) {
      this.verify();
    }
  }

  onKeyDown(event: KeyboardEvent, idx: number) {
    const inputs = this.digitInputs.toArray();

    if (event.key === 'Backspace') {
      const updated = [...this.digits()];
      if (updated[idx] !== '') {
        updated[idx] = '';
        this.digits.set(updated);
      } else if (idx > 0) {
        updated[idx - 1] = '';
        this.digits.set(updated);
        inputs[idx - 1]?.nativeElement.focus();
      }
      event.preventDefault();
    }

    if (event.key === 'ArrowLeft' && idx > 0) inputs[idx - 1]?.nativeElement.focus();
    if (event.key === 'ArrowRight' && idx < 5) inputs[idx + 1]?.nativeElement.focus();
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
    const updated = ['', '', '', '', '', ''];
    digits.forEach((d, i) => { updated[i] = d; });
    this.digits.set(updated);
    this.error.set(false);

    const lastFilledIdx = Math.min(digits.length, 5);
    const inputs = this.digitInputs.toArray();
    setTimeout(() => inputs[lastFilledIdx]?.nativeElement.focus());

    if (updated.every(d => d !== '')) {
      setTimeout(() => this.verify(), 120);
    }
  }

  async verify() {
    if (this.verifying() || this.otpValue().length !== 6) return;

    this.error.set(false);
    this.helperMessage.set('Verifying code...');

    try {
      const success = await this.verifyState.runPromise(this.auth.verify2faRemote(this.otpValue()), {
        errorMessage: 'Unable to verify code right now.',
      });

      if (success === null) {
        this.error.set(true);
        this.helperMessage.set(this.requestError() ?? 'Unable to verify code right now.');
        this.toast.error(this.requestError() ?? 'Unable to verify code right now.');
        return;
      }

      if (!success) {
        this.digits.set(['', '', '', '', '', '']);
        this.error.set(true);
        this.helperMessage.set('Invalid or expired code. Please try again.');
        this.toast.error('Invalid or expired 2FA code.');
        setTimeout(() => {
          const inputs = this.digitInputs.toArray();
          inputs[0]?.nativeElement.focus();
        }, 50);
        return;
      }

      this.helperMessage.set('Code verified. Redirecting...');
      this.toast.success('Two-factor verification complete.');
      await this.router.navigateByUrl('/');
    } catch {
      this.error.set(true);
      this.helperMessage.set('Unable to verify code right now.');
      this.toast.error('Unable to verify code right now.');
    }
  }

  requestNewCode() {
    this.helperMessage.set('Use forgot password from login if your code has expired.');
    this.toast.info('Code resend is not available yet.');
  }

  goBack() {
    this.auth.logout();
    this.router.navigateByUrl('/auth/login');
  }
}
