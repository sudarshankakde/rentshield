import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-angular';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthLayoutComponent } from '../shared/auth-layout.component';
import { AUTH_FORM_STYLES } from '../shared/auth-form.styles';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, AuthLayoutComponent],
  template: `
    <app-auth-layout title="Welcome back" subtitle="Sign in with email and password, then continue to 2FA verification.">
      <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="input-group">
          <label class="input-label">Email</label>
          <div class="input-wrap input-field">
            <span class="input-icon"><lucide-icon [name]="MailIcon" size="16"></lucide-icon></span>
            <input class="pl-5 w-100" type="email" formControlName="email" placeholder="you@example.com" autocomplete="email">
          </div>
          <p *ngIf="showError('email')" class="input-error">Enter a valid email address.</p>
        </div>

        <div class="input-group">
          <label class="input-label">Password</label>
          <div class="input-wrap">
            <span class="input-icon"><lucide-icon [name]="LockIcon" size="16"></lucide-icon></span>
            <input class="input-field pl-10 pr-11" [type]="showPassword() ? 'text' : 'password'" formControlName="password" placeholder="At least 6 characters" autocomplete="current-password">
            <button class="password-toggle" type="button" (click)="showPassword.set(!showPassword())">
              <lucide-icon [name]="showPassword() ? EyeOffIcon : EyeIcon" size="16"></lucide-icon>
            </button>
          </div>
          <p *ngIf="showError('password')" class="input-error">Password must be at least 6 characters.</p>
        </div>

        <a routerLink="/auth/forgot-password" class="link-inline">Forgot password?</a>

        <button type="submit" class="submit-btn" [disabled]="busy()">
          <span class="spinner" *ngIf="busy()"></span>
          <span>{{ busy() ? 'Signing in...' : 'Continue to 2FA' }}</span>
          <lucide-icon *ngIf="!busy()" [name]="ArrowIcon" size="15"></lucide-icon>
        </button>
      </form>

      <p layout-footer class="text-center text-xs text-muted-var font-medium mt-5">
        New to RentShield?
        <a routerLink="/auth/register" class="link-inline ml-1">Create account</a>
      </p>
    </app-auth-layout>
  `,
  styles: [AUTH_FORM_STYLES],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly MailIcon = Mail;
  readonly LockIcon = Lock;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly ArrowIcon = ArrowRight;

  readonly busy = signal(false);
  readonly submitted = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  showError(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (this.submitted() || control.touched);
  }

  async submit(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid || this.busy()) {
      this.form.markAllAsTouched();
      return;
    }

    this.busy.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      const result = await this.auth.loginWithPassword(email.trim(), password);

      if (result.requiresTwoFactor) {
        this.toast.info('OTP sent. Complete two-factor verification.');
        await this.router.navigateByUrl('/auth/two-factor');
        return;
      }

      this.toast.success('Signed in successfully.');
      await this.router.navigateByUrl('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in.';
      this.toast.error(message);
    } finally {
      this.busy.set(false);
    }
  }
}
