import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, User, Camera, Mail, Phone, MapPin, Shield, Key, Lock, Check } from 'lucide-angular';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-10 max-w-5xl mx-auto pb-20">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 class="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Identity & Profile</h2>
          <p class="text-brand font-bold uppercase tracking-widest text-[10px] mt-2 drop-shadow-sm">Manage your verified credentials</p>
        </div>
        <button (click)="toggleEdit()" 
                class="relative overflow-hidden group bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:-translate-y-1 hover:shadow-brand/30">
          <span class="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -translate-x-full"></span>
          <span class="relative z-10">{{ isEditing() ? 'Cancel Edit' : 'Edit Profile' }}</span>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="profileQuery.isLoading()" class="h-96 rounded-3xl bg-surface-soft border border-muted animate-pulse flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin"></div>
          <p class="text-sm font-bold text-muted-var uppercase tracking-widest">Loading secure profile...</p>
        </div>
      </div>

      <div *ngIf="profileQuery.data() as userProfile" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Sidebar: Profile Image & Security Stats -->
        <div class="space-y-6">
           <div class="bg-surface/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border shadow-xl relative overflow-hidden group">
              <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-secondary to-brand-primary"></div>
              <div class="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div class="relative inline-block mb-6 mt-4">
                 <div class="w-32 h-32 rounded-full bg-surface-soft flex items-center justify-center border-4 border-surface shadow-2xl overflow-hidden relative z-10">
                    <img *ngIf="userProfile?.avatar" [src]="userProfile.avatar" class="w-full h-full object-cover">
                    <lucide-icon *ngIf="!userProfile?.avatar" [name]="UserIcon" size="48" class="text-text-soft"></lucide-icon>
                 </div>
                 <button *ngIf="isEditing()" class="absolute -bottom-2 -right-2 z-20 w-12 h-12 bg-brand-primary text-white rounded-full shadow-lg flex items-center justify-center border-4 border-surface hover:scale-110 transition-transform">
                    <lucide-icon [name]="CameraIcon" size="18"></lucide-icon>
                 </button>
              </div>

              <h3 class="text-2xl font-black tracking-tight text-text relative z-10">{{ userProfile?.firstName }} {{ userProfile?.lastName }}</h3>
              <p class="text-brand-primary font-black text-[10px] uppercase tracking-widest mt-1 relative z-10">{{ auth.roleLabel() }}</p>
           </div>

           <div class="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden border border-slate-700">
              <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]"></div>
              
              <div class="relative z-10">
                <div class="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                   <div class="flex items-center gap-3">
                     <div class="p-2 bg-emerald-500/20 rounded-xl">
                       <lucide-icon [name]="ShieldIcon" size="20" class="text-emerald-400"></lucide-icon>
                     </div>
                     <h4 class="text-sm font-black uppercase tracking-widest">Security Status</h4>
                   </div>
                </div>

                <div class="space-y-5">
                   <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-slate-400">KYC Verification</span>
                      <span class="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.2)]">VERIFIED</span>
                   </div>
                   
                   <div class="flex items-center justify-between pt-4 border-t border-white/5">
                      <div class="flex flex-col">
                        <span class="text-xs font-bold text-slate-400">Two-Factor Auth</span>
                        <span class="text-[10px] text-slate-500 mt-1 max-w-[120px] leading-tight">Add an extra layer of security</span>
                      </div>
                      <button (click)="toggle2faMutation.mutate(!userProfile?.twoFactorEnabled)" 
                              [disabled]="toggle2faMutation.isPending()"
                              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                              [ngClass]="userProfile?.twoFactorEnabled ? 'bg-emerald-500' : 'bg-slate-600'">
                        <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                              [ngClass]="userProfile?.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'"></span>
                      </button>
                   </div>
                </div>
              </div>
           </div>
        </div>

        <div class="lg:col-span-2 space-y-8">
          <!-- Main Profile Form -->
          <div class="bg-surface/80 backdrop-blur-xl p-8 lg:p-10 rounded-[3rem] border border-border shadow-xl">
            <div class="flex items-center gap-3 mb-8">
              <div class="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                <lucide-icon [name]="UserIcon" size="20"></lucide-icon>
              </div>
              <h3 class="text-xl font-black text-text">Personal Details</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">First Name</label>
                  <input [(ngModel)]="editForm.firstName" [disabled]="!isEditing()"
                          class="w-full bg-surface-soft border border-border focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 rounded-2xl p-4 font-bold text-text transition-all outline-none disabled:opacity-60 disabled:bg-surface-muted">
                </div>
                <div class="space-y-2">
                  <label class="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Last Name</label>
                  <input [(ngModel)]="editForm.lastName" [disabled]="!isEditing()"
                          class="w-full bg-surface-soft border border-border focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 rounded-2xl p-4 font-bold text-text transition-all outline-none disabled:opacity-60 disabled:bg-surface-muted">
                </div>

                <div class="space-y-2 md:col-span-2">
                  <label class="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Email Address (Read Only)</label>
                  <div class="relative">
                      <lucide-icon [name]="MailIcon" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft"></lucide-icon>
                      <input [value]="userProfile?.email" disabled
                            class="w-full bg-surface-muted border border-border rounded-2xl p-4 pl-12 font-bold text-text-muted transition-all outline-none opacity-70 cursor-not-allowed">
                  </div>
                </div>
            </div>

            <div class="mt-8 flex justify-end" *ngIf="isEditing()">
              <button (click)="saveProfile()" [disabled]="updateProfileMutation.isPending()"
                      class="bg-brand-primary text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-brand/30 hover:bg-brand-primary-dark transition-all flex items-center gap-2">
                <lucide-icon *ngIf="updateProfileMutation.isPending()" [name]="UserIcon" size="16" class="animate-pulse"></lucide-icon>
                <lucide-icon *ngIf="!updateProfileMutation.isPending()" [name]="CheckIcon" size="16"></lucide-icon>
                {{ updateProfileMutation.isPending() ? 'Saving...' : 'Save Profile' }}
              </button>
            </div>
          </div>

          <!-- Password Change Section -->
          <div class="bg-surface/80 backdrop-blur-xl p-8 lg:p-10 rounded-[3rem] border border-border shadow-xl">
            <div class="flex items-center gap-3 mb-8">
              <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <lucide-icon [name]="KeyIcon" size="20"></lucide-icon>
              </div>
              <h3 class="text-xl font-black text-text">Security & Password</h3>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">Current Password</label>
                <div class="relative">
                  <lucide-icon [name]="LockIcon" size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft"></lucide-icon>
                  <input type="password" [(ngModel)]="passwordForm.currentPassword" placeholder="••••••••"
                         class="w-full bg-surface-soft border border-border focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 rounded-2xl p-4 pl-12 font-bold text-text transition-all outline-none">
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] ml-1">New Password</label>
                <div class="relative">
                  <lucide-icon [name]="LockIcon" size="16" class="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft"></lucide-icon>
                  <input type="password" [(ngModel)]="passwordForm.newPassword" placeholder="••••••••"
                         class="w-full bg-surface-soft border border-border focus:border-rose-400 focus:ring-4 focus:ring-rose-400/10 rounded-2xl p-4 pl-12 font-bold text-text transition-all outline-none">
                </div>
              </div>
            </div>

            <div class="mt-8 flex justify-end">
              <button (click)="changePassword()" [disabled]="changePasswordMutation.isPending() || !passwordForm.currentPassword || !passwordForm.newPassword"
                      class="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2">
                {{ changePasswordMutation.isPending() ? 'Updating...' : 'Update Password' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserProfileComponent {
  toastService = inject(ToastService);
  auth = inject(AuthService);
  api = inject(RentShieldApiService);
  queryClient = inject(QueryClient);

  readonly UserIcon = User;
  readonly CameraIcon = Camera;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly MapIcon = MapPin;
  readonly ShieldIcon = Shield;
  readonly KeyIcon = Key;
  readonly LockIcon = Lock;
  readonly CheckIcon = Check;

  isEditing = signal(false);

  editForm = {
    firstName: '',
    lastName: '',
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
  };

  profileQuery = injectQuery(() => ({
    queryKey: ['profile'],
    queryFn: () => firstValueFrom(this.api.profile.get()) as Promise<any>,
  }));

  constructor() {
    effect(() => {
      const data = this.profileQuery.data();
      if (data && !this.isEditing()) {
        this.editForm.firstName = data.firstName || '';
        this.editForm.lastName = data.lastName || '';
      }
    });
  }

  toggleEdit() {
    this.isEditing.set(!this.isEditing());
    if (!this.isEditing()) {
      // Reset form if cancelled
      const data = this.profileQuery.data();
      if (data) {
        this.editForm.firstName = data.firstName || '';
        this.editForm.lastName = data.lastName || '';
      }
    }
  }

  updateProfileMutation = injectMutation(() => ({
    mutationFn: (payload: { firstName: string; lastName: string }) => firstValueFrom(this.api.profile.update(payload)),
    onSuccess: () => {
      this.toastService.success('Profile updated successfully');
      this.isEditing.set(false);
      this.queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Sync auth state if needed
      this.auth.updateUser({ name: this.editForm.firstName + ' ' + this.editForm.lastName });
    },
    onError: (err: any) => {
      this.toastService.error(err?.message || 'Failed to update profile');
    }
  }));

  saveProfile() {
    this.updateProfileMutation.mutate({
      firstName: this.editForm.firstName,
      lastName: this.editForm.lastName
    });
  }

  changePasswordMutation = injectMutation(() => ({
    mutationFn: (payload: any) => firstValueFrom(this.api.profile.changePassword(payload)),
    onSuccess: () => {
      this.toastService.success('Password changed successfully');
      this.passwordForm = { currentPassword: '', newPassword: '' };
    },
    onError: (err: any) => {
      this.toastService.error(err?.message || 'Failed to change password');
    }
  }));

  changePassword() {
    if (this.passwordForm.newPassword.length < 6) {
      this.toastService.error('New password must be at least 6 characters');
      return;
    }
    this.changePasswordMutation.mutate(this.passwordForm);
  }

  toggle2faMutation = injectMutation(() => ({
    mutationFn: (enabled: boolean) => firstValueFrom(this.api.profile.toggle2fa(enabled)),
    onSuccess: () => {
      this.toastService.success('2FA settings updated');
      this.queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: any) => {
      this.toastService.error(err?.message || 'Failed to update 2FA settings');
    }
  }));
}

