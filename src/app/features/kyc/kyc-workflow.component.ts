import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, BadgeCheck, Camera, FileText, ShieldCheck, UploadCloud, AlertCircle, Clock, CheckCircle2 } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-kyc-workflow',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-8 pb-20">
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 class="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Identity Verification</h2>
          <p class="text-brand font-bold uppercase tracking-widest text-[10px] mt-2 drop-shadow-sm">Secure KYC Onboarding</p>
          <p class="text-muted-var font-semibold mt-2 max-w-xl text-sm leading-relaxed">Aadhaar, PAN, address proof, and liveness checks ensure a secure community. Verification unlocks payments, agreements, and move-in workflows.</p>
        </div>
        <button (click)="submitKyc()" [disabled]="submitMutation.isPending() || kycStatusQuery.data()?.status === 'APPROVED'" 
                class="relative overflow-hidden group bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:-translate-y-1 hover:shadow-brand/30 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none">
          <span class="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -translate-x-full"></span>
          <span class="relative z-10 flex items-center gap-2">
            <lucide-icon *ngIf="submitMutation.isPending()" [name]="ClockIcon" size="16" class="animate-spin"></lucide-icon>
            {{ submitMutation.isPending() ? 'Submitting...' : (kycStatusQuery.data()?.status === 'APPROVED' ? 'Verified' : 'Submit KYC') }}
          </span>
        </button>
      </header>

      <!-- Loading State -->
      <div *ngIf="kycStatusQuery.isLoading()" class="h-64 rounded-[3rem] bg-surface-soft border border-muted animate-pulse flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin"></div>
          <p class="text-sm font-bold text-muted-var uppercase tracking-widest">Loading Verification Status...</p>
        </div>
      </div>

      <section *ngIf="kycStatusQuery.data() as kycData" class="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        <div class="bg-surface/80 backdrop-blur-xl border border-border rounded-[3rem] p-8 lg:p-10 shadow-xl relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none"></div>
          
          <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div *ngFor="let step of steps" 
                 class="group rounded-3xl border border-border bg-surface-soft p-6 transition-all hover:shadow-lg hover:border-brand/30 relative overflow-hidden">
              <div class="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div class="relative z-10">
                <div class="flex justify-between items-start mb-4">
                  <div class="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 group-hover:rotate-3"
                       [ngClass]="getStepColor(step.status)">
                    <lucide-icon [name]="step.icon" size="22"></lucide-icon>
                  </div>
                  <span class="inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm"
                        [ngClass]="getStatusBadge(step.status)">
                    {{step.status}}
                  </span>
                </div>
                
                <h3 class="font-black text-text text-lg tracking-tight">{{step.title}}</h3>
                <p class="text-xs text-text-muted font-medium mt-2 leading-relaxed">{{step.description}}</p>
                
                <div class="mt-6 pt-4 border-t border-border flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                   <button class="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:text-brand-primary-dark transition-colors flex items-center gap-1">
                     Manage <lucide-icon [name]="UploadIcon" size="12"></lucide-icon>
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Sidebar -->
        <aside class="bg-gradient-to-br from-slate-950 to-slate-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden h-fit border border-slate-800">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.2),transparent_50%)] pointer-events-none"></div>
          
          <div class="relative z-10">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-white/10"
                 [ngClass]="getMainStatusIconBg(kycData.status)">
              <lucide-icon [name]="getMainStatusIcon(kycData.status)" size="32" [class]="getMainStatusIconColor(kycData.status)"></lucide-icon>
            </div>
            
            <p class="text-[10px] text-white/50 font-black uppercase tracking-[0.2em]">Overall Verification</p>
            <h2 class="text-4xl font-black mt-2 tracking-tight drop-shadow-md" [ngClass]="getMainStatusTextColor(kycData.status)">{{ kycData.status || 'PENDING' }}</h2>
            
            <div class="mt-8 space-y-4">
               <div class="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                 <p class="text-xs font-medium text-white/80 leading-relaxed">
                   <strong class="text-white block mb-1">Why is this required?</strong>
                   Regulatory compliance mandates strict identity checks before allowing financial transactions or legally binding digital agreements.
                 </p>
               </div>
               
               <div *ngIf="kycData.status === 'UNDER_REVIEW'" class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-md flex gap-3 items-start">
                  <lucide-icon [name]="ClockIcon" size="16" class="text-amber-400 mt-0.5 flex-shrink-0"></lucide-icon>
                  <p class="text-xs font-medium text-amber-200/90 leading-relaxed">
                    Your documents are currently being manually reviewed by an administrator. This usually takes 24-48 hours.
                  </p>
               </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  `
})
export class KycWorkflowComponent {
  api = inject(RentShieldApiService);
  queryClient = inject(QueryClient);
  toastService = inject(ToastService);

  readonly BadgeIcon = BadgeCheck;
  readonly UploadIcon = UploadCloud;
  readonly ClockIcon = Clock;

  kycStatusQuery = injectQuery(() => ({
    queryKey: ['kyc-status'],
    queryFn: () => firstValueFrom(this.api.kyc.status()) as Promise<any>,
  }));

  submitMutation = injectMutation(() => ({
    mutationFn: () => firstValueFrom(this.api.kyc.start({ type: 'FULL_KYC' })),
    onSuccess: () => {
      this.toastService.success('KYC Submission sent successfully');
      this.queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
    },
    onError: (err: any) => {
      this.toastService.error(err?.message || 'Failed to submit KYC');
    }
  }));

  // Local state mapped steps (would normally be synced with backend)
  steps = [
    { title: 'Identity Proof', description: 'Aadhaar or passport upload with masked number preview.', status: 'APPROVED', icon: ShieldCheck },
    { title: 'PAN Check', description: 'Tax identity verification for rent and deposit records.', status: 'APPROVED', icon: FileText },
    { title: 'Address Proof', description: 'Utility bill, bank statement, or current lease proof.', status: 'PENDING', icon: UploadCloud },
    { title: 'Selfie Liveness', description: 'Camera capture and liveness confidence result.', status: 'NOT_STARTED', icon: Camera }
  ];

  submitKyc() {
    this.submitMutation.mutate();
  }

  getStepColor(status: string) {
    if (status === 'APPROVED') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    if (status === 'PENDING') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
  }

  getStatusBadge(status: string) {
    if (status === 'APPROVED') return 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30';
    if (status === 'PENDING') return 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30';
    return 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }

  getMainStatusIcon(status: string) {
    if (status === 'APPROVED') return CheckCircle2;
    if (status === 'UNDER_REVIEW') return Clock;
    return AlertCircle;
  }

  getMainStatusIconBg(status: string) {
    if (status === 'APPROVED') return 'bg-emerald-500/20';
    if (status === 'UNDER_REVIEW') return 'bg-brand-primary/20';
    return 'bg-slate-500/20';
  }

  getMainStatusIconColor(status: string) {
    if (status === 'APPROVED') return 'text-emerald-400';
    if (status === 'UNDER_REVIEW') return 'text-brand-primary-light';
    return 'text-slate-400';
  }

  getMainStatusTextColor(status: string) {
    if (status === 'APPROVED') return 'text-emerald-400';
    if (status === 'UNDER_REVIEW') return 'text-white';
    return 'text-slate-400';
  }
}
