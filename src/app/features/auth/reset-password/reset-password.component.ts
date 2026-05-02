import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LucideAngularModule, ArrowRight, Lock, Mail, KeyRound } from 'lucide-angular';
import { RentShieldApiService } from '../../../core/api/rentshield-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthLayoutComponent } from '../shared/auth-layout.component';
import { AUTH_FORM_STYLES } from '../shared/auth-form.styles';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, AuthLayoutComponent],
  template: `
    <app-auth-layout title="Set new password" subtitle="Use your reset code and choose a strong new password.">
      <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="input-group">
          <label class="input-label">Email</label>
          <div class="input-wrap">
            <span class="input-icon"><lucide-icon [name]="MailIcon" size="16"></lucide-icon></span>
            <input class="input-field pl-10" type="email" formControlName="email" placeholder="you@example.com" autocomplete="email">
          </div>
          <p *ngIf="showError('email')" class="input-error">Enter a valid email address.</p>
        </div>

        <div class="input-group">
          <label class="input-label">Reset code</label>
          <div class="input-wrap">
            <span class="input-icon"><lucide-icon [name]="KeyIcon" size="16"></lucide-icon></span>
            <input class="input-field pl-10" formControlName="code" placeholder="6-digit code" autocomplete="one-time-code">
          </div>
          <p *ngIf="showError('code')" class="input-error">Reset code is required.</p>
        </div>

        <div class="input-group">
          <label class="input-label">New password</label>
          <div class="input-wrap">
            <span class="input-icon"><lucide-icon [name]="LockIcon" size="16"></lucide-icon></span>
            <input class="input-field pl-10" type="password" formControlName="newPassword" placeholder="At least 6 characters" autocomplete="new-password">
          </div>
          <p *ngIf="showError('newPassword')" class="input-error">Password must be at least 6 characters.</p>
        </div>

        <div class="input-group">
          <label class="input-label">Confirm password</label>
          <div class="input-wrap">
            <span class="input-icon"><lucide-icon [name]="LockIcon" size="16"></lucide-icon></span>
            <input class="input-field pl-10" type="password" formControlName="confirmPassword" placeholder="Re-enter password" autocomplete="new-password">
          </div>
          <p *ngIf="submitted() && form.hasError('passwordMismatch')" class="input-error">Passwords do not match.</p>
        </div>

        <button type="submit" class="submit-btn" [disabled]="busy()">
          <span class="spinner" *ngIf="busy()"></span>
          <span>{{ busy() ? 'Resetting...' : 'Reset Password' }}</span>
          <lucide-icon *ngIf="!busy()" [name]="ArrowIcon" size="15"></lucide-icon>
        </button>
      </form>

      <p layout-footer class="text-center text-xs text-muted-var font-medium mt-5">
        Go back to
        <a routerLink="/auth/login" class="link-inline ml-1">sign in</a>
      </p>
    </app-auth-layout>
  `,
  styles: [AUTH_FORM_STYLES],
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly MailIcon = Mail;
  readonly LockIcon = Lock;
  readonly KeyIcon = KeyRound;
  readonly ArrowIcon = ArrowRight;

  readonly busy = signal(false);
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]],
      code: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: (group) => {
        const password = group.get('newPassword')?.value ?? '';
        const confirm = group.get('confirmPassword')?.value ?? '';
        return password === confirm ? null : { passwordMismatch: true };
      },
    }
  );

  showError(controlName: 'email' | 'code' | 'newPassword'): boolean {
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
      const value = this.form.getRawValue();
      const response = await firstValueFrom(this.api.auth.resetPassword({
        email: value.email.trim(),
        code: value.code.trim(),
        newPassword: value.newPassword,
      }));

      const message =
        typeof response === 'object' && response !== null && 'message' in response
          ? String((response as { message: unknown }).message)
          : 'Password reset successful.';

      this.toast.success(message);
      await this.router.navigateByUrl('/auth/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to reset password.';
      this.toast.error(message);
    } finally {
      this.busy.set(false);
    }
  }
}
