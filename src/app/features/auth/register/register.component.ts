import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  ArrowRight,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff
} from 'lucide-angular';

import { AuthService, UserRole } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthLayoutComponent } from '../shared/auth-layout.component';
import { AUTH_FORM_STYLES } from '../shared/auth-form.styles';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideAngularModule,
    AuthLayoutComponent
  ],
  template: `
    <app-auth-layout
      title="Create account"
      subtitle="Register your profile and role to unlock module access."
    >
      <form
        class="auth-form"
        [formGroup]="form"
        (ngSubmit)="submit()"
        novalidate
      >

        <div class="grid grid-cols-2 gap-3">

          <div class="input-group">
            <label class="input-label">First name</label>

            <div class="input-wrap">
              <span class="input-icon">
                <lucide-icon [name]="UserIcon" size="16"></lucide-icon>
              </span>

              <input
                class="input-field pl-10"
                formControlName="firstName"
                autocomplete="given-name"
                placeholder="anuj"
              >
            </div>

            <p *ngIf="showError('firstName')" class="input-error">
              First name is required.
            </p>
          </div>

          <div class="input-group">
            <label class="input-label">Last name</label>

            <div class="input-wrap">
              <span class="input-icon">
                <lucide-icon [name]="UserIcon" size="16"></lucide-icon>
              </span>

              <input
                class="input-field pl-10"
                formControlName="lastName"
                autocomplete="family-name"
                placeholder="Doe"
              >
            </div>

            <p *ngIf="showError('lastName')" class="input-error">
              Last name is required.
            </p>
          </div>

        </div>

        <div class="input-group">
          <label class="input-label">Email</label>

          <div class="input-wrap">
            <span class="input-icon">
              <lucide-icon [name]="MailIcon" size="16"></lucide-icon>
            </span>

            <input
              class="input-field pl-10"
              type="email"
              formControlName="email"
              placeholder="you@example.com"
              autocomplete="email"
            >
          </div>

          <p *ngIf="showError('email')" class="input-error">
            Enter a valid email address.
          </p>
        </div>

        <div class="input-group">
          <label class="input-label">Password</label>

          <div class="input-wrap">

            <span class="input-icon">
              <lucide-icon [name]="LockIcon" size="16"></lucide-icon>
            </span>

            <input
              class="input-field pl-10 pr-12"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              placeholder="8+ chars with letters & numbers"
              autocomplete="new-password"
            >

            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-var"
              (click)="showPassword.set(!showPassword())"
            >
              <lucide-icon
                [name]="showPassword() ? EyeOffIcon : EyeIcon"
                size="16">
              </lucide-icon>
            </button>

          </div>

          <p *ngIf="showError('password')" class="input-error">
            Password must be at least 8 characters and include letters and numbers.
          </p>
        </div>

        <div class="input-group">
          <label class="input-label">Confirm password</label>

          <div class="input-wrap">
            <span class="input-icon">
              <lucide-icon [name]="LockIcon" size="16"></lucide-icon>
            </span>

            <input
              class="input-field pl-10"
              type="password"
              formControlName="confirmPassword"
              placeholder="Re-enter password"
              autocomplete="new-password"
            >
          </div>

          <p
            *ngIf="submitted() && form.hasError('passwordMismatch')"
            class="input-error"
          >
            Passwords do not match.
          </p>
        </div>

        <div class="input-group">
          <label class="input-label">Role</label>

          <div class="grid grid-cols-3 gap-2 mt-1.5">

            <button
              *ngFor="let option of roles"
              type="button"
              class="role-pill"
              [class.role-pill--active]="form.controls.role.value === option.value"
              (click)="form.controls.role.setValue(option.value)"
            >
              {{ option.label }}
            </button>

          </div>
        </div>

        <button
          type="submit"
          class="submit-btn"
          [disabled]="busy()"
        >
          <span class="spinner" *ngIf="busy()"></span>

          <span>
            {{ busy() ? 'Creating account...' : 'Create Account' }}
          </span>

          <lucide-icon
            *ngIf="!busy()"
            [name]="ArrowIcon"
            size="15"
          >
          </lucide-icon>
        </button>

      </form>

      <p
        layout-footer
        class="text-center text-xs text-muted-var font-medium mt-5"
      >
        Already have an account?

        <a
          routerLink="/auth/login"
          class="link-inline ml-1"
        >
          Sign in
        </a>
      </p>

    </app-auth-layout>
  `,
  styles: [`
    ${AUTH_FORM_STYLES}

    .role-pill {
      min-height: 2rem;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-muted);
      font-size: 0.67rem;
      line-height: 1.1;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      font-weight: 800;
      transition: all 0.1s ease;
      cursor: pointer;
      transform: translateY(0);
      padding: 0.3rem 0.2rem;
    }

    .role-pill:hover {
      border-color: var(--brand-primary);
      color: var(--brand-primary);
      transform: translateY(-1px);
    }

    .role-pill--active {
      background: var(--brand-primary);
      border-color: var(--brand-primary);
      color: #fff;
    }

    .role-pill--active:hover {
      color: #fff;
    }
  `],
})
export class RegisterComponent {

  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly UserIcon = User;
  readonly MailIcon = Mail;
  readonly LockIcon = Lock;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly ArrowIcon = ArrowRight;

  readonly busy = signal(false);
  readonly submitted = signal(false);

  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly roles: Array<{ value: UserRole; label: string }> = [
    { value: 'TENANT', label: 'Tenant' },
    { value: 'LANDLORD', label: 'Landlord' },
    { value: 'BROKER', label: 'Broker' },
    { value: 'EXPERT', label: 'Expert' },
    { value: 'SUPPORT', label: 'Support' },
    { value: 'PLATFORM_ADMIN', label: 'Admin' },
  ];

  readonly form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required]],

      lastName: ['', [Validators.required]],

      email: ['', [Validators.required, Validators.email]],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
        ]
      ],

      confirmPassword: ['', [Validators.required]],

      role: this.fb.nonNullable.control<UserRole>(
        'TENANT',
        Validators.required
      ),
    },

    {
      validators: (group) => {

        const password = group.get('password')?.value ?? '';
        const confirm = group.get('confirmPassword')?.value ?? '';

        return password === confirm
          ? null
          : { passwordMismatch: true };
      },
    }
  );

  showError(
    controlName: 'firstName' | 'lastName' | 'email' | 'password'
  ): boolean {

    const control = this.form.controls[controlName];

    return control.invalid &&
      (this.submitted() || control.touched);
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

      await this.auth.register({
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        email: value.email.trim(),
        password: value.password,
        role: value.role,
      });

      this.toast.success('Account created successfully.');

      await this.router.navigateByUrl('/');

    } catch (error) {

      console.error(error);

      this.toast.error(
        'Unable to create account right now. Please try again later.'
      );

    } finally {

      this.busy.set(false);
    }
  }
}