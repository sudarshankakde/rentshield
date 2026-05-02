import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, BadgeCheck, Camera, FileText, ShieldCheck, UploadCloud } from 'lucide-angular';

@Component({
  selector: 'app-kyc-workflow',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-8 pb-20">
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p class="text-xs font-black text-indigo-600 uppercase tracking-widest">POST /kyc/start · GET /kyc/status</p>
          <h1 class="text-4xl font-black text-slate-950 tracking-tight mt-2">KYC Verification</h1>
          <p class="text-slate-500 font-semibold mt-2">Aadhaar, PAN, address proof, selfie/liveness, and reviewer status in one flow.</p>
        </div>
        <button class="bg-indigo-600 text-white px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest">Submit KYC</button>
      </header>

      <section class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div *ngFor="let step of steps" class="rounded-xl border border-slate-100 p-5">
              <div class="w-11 h-11 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <lucide-icon [name]="step.icon" size="22"></lucide-icon>
              </div>
              <h3 class="font-black text-slate-900">{{step.title}}</h3>
              <p class="text-sm text-slate-500 font-medium mt-1">{{step.description}}</p>
              <span class="inline-flex mt-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                    [ngClass]="step.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : step.status === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'">
                {{step.status}}
              </span>
            </div>
          </div>
        </div>

        <aside class="bg-slate-950 text-white rounded-2xl p-6">
          <div class="w-12 h-12 rounded-lg bg-emerald-400/10 text-emerald-300 flex items-center justify-center mb-5">
            <lucide-icon [name]="BadgeIcon" size="24"></lucide-icon>
          </div>
          <p class="text-[10px] text-slate-500 font-black uppercase tracking-widest">Current Status</p>
          <h2 class="text-3xl font-black mt-2">UNDER_REVIEW</h2>
          <p class="text-sm text-slate-400 font-medium mt-3">KYC gates payments, agreements, move-in, and police verification until approval.</p>
        </aside>
      </section>
    </div>
  `
})
export class KycWorkflowComponent {
  readonly BadgeIcon = BadgeCheck;

  steps = [
    { title: 'Identity Proof', description: 'Aadhaar or passport upload with masked number preview.', status: 'APPROVED', icon: ShieldCheck },
    { title: 'PAN Check', description: 'Tax identity verification for rent and deposit records.', status: 'APPROVED', icon: FileText },
    { title: 'Address Proof', description: 'Utility bill, bank statement, or current lease proof.', status: 'PENDING', icon: UploadCloud },
    { title: 'Selfie Liveness', description: 'Camera capture and liveness confidence result.', status: 'NOT_STARTED', icon: Camera }
  ];
}
