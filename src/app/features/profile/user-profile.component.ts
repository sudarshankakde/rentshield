import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, User, Camera, Mail, Phone, MapPin, Shield } from 'lucide-angular';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-10 max-w-4xl mx-auto pb-20">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-black text-slate-900 tracking-tight">Identity & Profile</h2>
          <p class="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Manage your verified credentials</p>
        </div>
        <button (click)="toggleEdit()" class="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-indigo-100">
          {{ isEditing() ? 'Save Changes' : 'Edit Profile' }}
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <!-- Sidebar: Profile Image & Stats -->
        <div class="space-y-6">
           <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group">
              <div class="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
              
              <div class="relative inline-block mb-6">
                 <div class="w-32 h-32 rounded-[2.5rem] bg-slate-100 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                    <img *ngIf="profile().avatar" [src]="profile().avatar" class="w-full h-full object-cover">
                    <lucide-icon *ngIf="!profile().avatar" [name]="UserIcon" size="48" class="text-slate-300"></lucide-icon>
                 </div>
                 <button *ngIf="isEditing()" class="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 text-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white hover:scale-110 transition-transform">
                    <lucide-icon [name]="CameraIcon" size="16"></lucide-icon>
                 </button>
              </div>

              <h3 class="text-2xl font-black text-slate-900 tracking-tight">{{profile().name}}</h3>
              <p class="text-indigo-600 font-black text-[10px] uppercase tracking-widest mt-1">Verified Tenant</p>
              
              <div class="mt-8 pt-8 border-t border-slate-50 flex items-center justify-around">
                 <div>
                    <p class="text-2xl font-black text-slate-900">4.9</p>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trust Score</p>
                 </div>
                 <div class="w-px h-10 bg-slate-100"></div>
                 <div>
                    <p class="text-2xl font-black text-slate-900">2y</p>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Member</p>
                 </div>
              </div>
           </div>

           <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white">
              <div class="flex items-center gap-3 mb-6">
                 <lucide-icon [name]="ShieldIcon" size="20" class="text-emerald-400"></lucide-icon>
                 <h4 class="text-sm font-black uppercase tracking-widest">Security Status</h4>
              </div>
              <div class="space-y-4">
                 <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold text-slate-400">KYC Status</span>
                    <span class="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">VERIFIED</span>
                 </div>
                 <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold text-slate-400">2FA Enabled</span>
                    <span class="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">ACTIVE</span>
                 </div>
              </div>
           </div>
        </div>

        <!-- Main Form -->
        <div class="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
           <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-2">
                 <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                 <div class="relative">
                    <input [(ngModel)]="profile().name" [disabled]="!isEditing()"
                           class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 font-bold text-slate-700 transition-all outline-none disabled:opacity-60">
                 </div>
              </div>

              <div class="space-y-2">
                 <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
                 <div class="relative">
                    <lucide-icon [name]="MailIcon" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></lucide-icon>
                    <input [(ngModel)]="profile().email" [disabled]="!isEditing()"
                           class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 pl-12 font-bold text-slate-700 transition-all outline-none disabled:opacity-60">
                 </div>
              </div>

              <div class="space-y-2">
                 <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                 <div class="relative">
                    <lucide-icon [name]="PhoneIcon" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></lucide-icon>
                    <input [(ngModel)]="profile().phone" [disabled]="!isEditing()"
                           class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 pl-12 font-bold text-slate-700 transition-all outline-none disabled:opacity-60">
                 </div>
              </div>

              <div class="space-y-2">
                 <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Location</label>
                 <div class="relative">
                    <lucide-icon [name]="MapIcon" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></lucide-icon>
                    <input [(ngModel)]="profile().location" [disabled]="!isEditing()"
                           class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl p-4 pl-12 font-bold text-slate-700 transition-all outline-none disabled:opacity-60">
                 </div>
              </div>
           </div>

           <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Bio / Professional Intro</label>
              <textarea [(ngModel)]="profile().bio" [disabled]="!isEditing()" rows="4"
                        class="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-3xl p-6 font-medium text-slate-600 transition-all outline-none disabled:opacity-60 leading-relaxed"></textarea>
           </div>
        </div>
      </div>
    </div>
  `
})
export class UserProfileComponent {
  toastService = inject(ToastService);
  auth = inject(AuthService);
  readonly UserIcon = User;
  readonly CameraIcon = Camera;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly MapIcon = MapPin;
  readonly ShieldIcon = Shield;

  isEditing = signal(false);

  profile = signal(this.loadProfile());

  toggleEdit() {
    if (this.isEditing()) {
      const profile = this.profile();
      localStorage.setItem(this.profileStorageKey(), JSON.stringify(profile));
      this.auth.updateUser({ name: profile.name, email: profile.email });
      this.toastService.success('Profile credentials updated successfully!');
    }
    this.isEditing.set(!this.isEditing());
  }

  private loadProfile() {
    const savedProfile = localStorage.getItem(this.profileStorageKey());
    if (savedProfile) {
      try {
        return JSON.parse(savedProfile) as {
          name: string;
          email: string;
          phone: string;
          location: string;
          bio: string;
          avatar: string;
        };
      } catch {
        localStorage.removeItem(this.profileStorageKey());
      }
    }

    const user = this.auth.user();
    return {
      name: user?.name ?? 'Sudarshan Kakde',
      email: user?.email ?? 'sudarshankakde1111@gmail.com',
      phone: '+91 98765 43210',
      location: 'Mumbai, Maharashtra',
      bio: 'Software engineer by profession, tenant by choice. Looking for a community-driven living space with high-speed internet and proximity to public transport.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
    };
  }

  private profileStorageKey() {
    const email = this.auth.user()?.email ?? 'guest';
    return `rentshield.profile.${email.toLowerCase()}`;
  }
}
