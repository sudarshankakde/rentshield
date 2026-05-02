import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LucideAngularModule, ArrowRight, Mail } from 'lucide-angular';
import { RentShieldApiService } from '../../../core/api/rentshield-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthLayoutComponent } from '../shared/auth-layout.component';
import { AUTH_FORM_STYLES } from '../shared/auth-form.styles';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, AuthLayoutComponent],
  template: `
    <app-auth-layout title="Recover account" subtitle="Enter your email and we will send a password reset code.">
      <form class="auth-form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="input-group">
          <label class="input-label">Email</label>
          <div class="input-wrap">
            <span class="input-icon"><lucide-icon [name]="MailIcon" size="16"></lucide-icon></span>
            <input class="input-field pl-10" type="email" formControlName="email" placeholder="you@example.com" autocomplete="email">
          </div>
          <p *ngIf="showError()" class="input-error">Enter your account email.</p>
        </div>

        <button type="submit" class="submit-btn" [disabled]="busy()">
          <span class="spinner" *ngIf="busy()"></span>
          <span>{{ busy() ? 'Sending code...' : 'Send Reset Code' }}</span>
          <lucide-icon *ngIf="!busy()" [name]="ArrowIcon" size="15"></lucide-icon>
        </button>
      </form>

      <p layout-footer class="text-center text-xs text-muted-var font-medium mt-5">
        Remembered your password?
        <a routerLink="/auth/login" class="link-inline ml-1">Back to sign in</a>
      </p>
    </app-auth-layout>
  `,
  styles: [AUTH_FORM_STYLES],
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly MailIcon = Mail;
  readonly ArrowIcon = ArrowRight;

  readonly busy = signal(false);
  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  showError(): boolean {
    const control = this.form.controls.email;
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
      const { email } = this.form.getRawValue();
      const response = await firstValueFrom(this.api.auth.forgotPassword(email.trim()));
      const message =
        typeof response === 'object' && response !== null && 'message' in response
          ? String((response as { message: unknown }).message)
          : 'Reset code sent successfully.';

      this.toast.success(message);
      await this.router.navigate(['/auth/reset-password'], { queryParams: { email: email.trim() } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send reset code.';
      this.toast.error(message);
    } finally {
      this.busy.set(false);
    }
  }
}
