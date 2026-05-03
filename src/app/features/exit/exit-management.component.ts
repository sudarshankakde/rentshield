import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Banknote, ClipboardCheck, DoorOpen, FileSignature, ShieldAlert, FileClock } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { ToastService } from '../../core/services/toast.service';
import { assertObject, readArray, readNumber, readString } from '../../core/api/request-validation';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-exit-management',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-8 pb-20">
      
      <!-- Loading State -->
      <div *ngIf="exitQuery.isLoading()" class="h-64 rounded-[3rem] bg-surface-soft border border-muted animate-pulse flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin"></div>
          <p class="text-sm font-bold text-muted-var uppercase tracking-widest">Syncing exit workflow...</p>
        </div>
      </div>

      <div *ngIf="exitQuery.error() as error" class="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700 shadow-sm flex items-center gap-3">
        <lucide-icon [name]="AlertIcon" size="20"></lucide-icon>
        {{ error.message || 'Failed to load exit details.' }}
      </div>

      <div *ngIf="!exitQuery.isLoading() && !exitQuery.error()" class="bg-surface/80 backdrop-blur-xl p-8 lg:p-12 rounded-[3rem] border border-border shadow-xl relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none"></div>

        <header class="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div class="flex items-center gap-3 mb-2">
               <div class="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner">
                 <lucide-icon [name]="DoorOpenIcon" size="20"></lucide-icon>
               </div>
               <p class="text-brand font-bold uppercase tracking-widest text-[10px] drop-shadow-sm">Deposit Settlement Engine</p>
            </div>
            <h1 class="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Exit Management</h1>
            <p class="text-muted-var font-semibold mt-2 max-w-xl text-sm leading-relaxed">Notice validation, final dues, move-out inspection, damage assessment, and closure.</p>
          </div>
          
          <button 
            (click)="requestExitMutation.mutate()" 
            [disabled]="requestExitMutation.isPending()"
            class="group relative overflow-hidden bg-gradient-to-r from-rose-500 to-rose-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 transition-all hover:-translate-y-1 hover:shadow-rose-500/40 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center gap-2">
             <span class="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -translate-x-full"></span>
             <span class="relative z-10 flex items-center gap-2">
               <lucide-icon *ngIf="requestExitMutation.isPending()" [name]="FileClockIcon" size="16" class="animate-pulse"></lucide-icon>
               <lucide-icon *ngIf="!requestExitMutation.isPending()" [name]="DoorOpenIcon" size="16"></lucide-icon>
               {{ requestExitMutation.isPending() ? 'Requesting...' : 'Request Exit' }}
             </span>
          </button>
        </header>

        <section class="relative z-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div class="bg-surface-soft border border-border rounded-[2.5rem] p-8 shadow-sm">
            <h3 class="text-xs font-black uppercase tracking-widest text-text-muted mb-6">Workflow Progress</h3>
            <div class="space-y-4">
              <div *ngFor="let step of steps(); let index = index" 
                   class="flex gap-5 p-5 rounded-[1.5rem] border transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
                   [ngClass]="step.done ? 'bg-surface border-emerald-500/20 shadow-emerald-500/5' : 'bg-surface-muted border-border'">
                <div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border"
                     [ngClass]="step.done ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-surface border-border text-text-muted'">
                  <lucide-icon [name]="step.icon" size="24"></lucide-icon>
                </div>
                <div class="grow">
                  <p class="text-[9px] font-black uppercase tracking-widest mb-1"
                     [ngClass]="step.done ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-muted'">Step {{index + 1}}</p>
                  <h3 class="font-black text-text text-lg tracking-tight">{{step.title}}</h3>
                  <p class="text-sm text-text-soft font-medium mt-1 leading-relaxed">{{step.description}}</p>
                </div>
                <div class="shrink-0 pt-1">
                  <span class="text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border shadow-sm flex items-center justify-center gap-1.5"
                        [ngClass]="step.done ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'">
                    <div class="w-1.5 h-1.5 rounded-full" [ngClass]="step.done ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'"></div>
                    {{step.done ? 'DONE' : 'PENDING'}}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <aside class="bg-surface border border-border rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div class="w-14 h-14 rounded-[1.25rem] bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6 border border-rose-500/20 shadow-inner">
                <lucide-icon [name]="AlertIcon" size="28"></lucide-icon>
              </div>
              <p class="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] mb-8">Settlement Preview</p>
              
              <div class="space-y-6">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-text-muted font-bold">Security Deposit</span>
                  <span class="text-lg font-black text-text">₹{{ settlement().deposit | number }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-text-muted font-bold">Pending Dues</span>
                  <span class="text-lg font-black text-rose-500">₹{{ settlement().pendingDues | number }}</span>
                </div>
              </div>
            </div>
            
            <div class="pt-6 mt-6 border-t border-border">
              <div class="flex items-center justify-between">
                <span class="text-xs text-text-muted font-black uppercase tracking-widest">Refund Estimate</span>
                <span class="text-3xl font-black text-emerald-500 tracking-tight">₹{{ settlement().refundEstimate | number }}</span>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  `
})
export class ExitManagementComponent {
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);
  private readonly queryClient = injectQueryClient();

  readonly AlertIcon = ShieldAlert;
  readonly DoorOpenIcon = DoorOpen;
  readonly BanknoteIcon = Banknote;
  readonly ClipboardCheckIcon = ClipboardCheck;
  readonly FileSignatureIcon = FileSignature;
  readonly FileClockIcon = FileClock;

  exitQuery = injectQuery(() => ({
    queryKey: ['exit-workflow'],
    queryFn: async () => {
      // 1. Fetch tenancies
      const tResponse = await firstValueFrom(this.api.tenant.tenancies());
      assertObject(tResponse, 'tenant tenancies response');
      const tenancies = readArray(tResponse['tenancies']);
      const firstTenancy = tenancies[0] && typeof tenancies[0] === 'object'
        ? (tenancies[0] as Record<string, unknown>)
        : null;
      const tenancyId = firstTenancy ? readString(firstTenancy['id']) : '';

      if (!tenancyId) {
        throw new Error('No active tenancy found.');
      }

      // 2. Fetch exit request for this tenancy
      let exitStatus = 'NOT_REQUESTED';
      let deposit = 0;
      let pendingDues = 0;
      
      try {
        const eResponse = await firstValueFrom(this.api.exit.getByTenancy(tenancyId));
        if (eResponse && typeof eResponse === 'object') {
          const eReq = (eResponse as Record<string, unknown>)['exitRequest'];
          if (eReq && typeof eReq === 'object') {
            const reqData = eReq as Record<string, unknown>;
            exitStatus = readString(reqData['status'], 'REQUESTED');
            deposit = readNumber(reqData['securityDepositHeld'], 0);
            pendingDues = readNumber(reqData['pendingDuesAmount'], 0);
          }
        }
      } catch (err) {
        // Exit request might not exist yet
      }

      return {
        tenancyId,
        status: exitStatus,
        deposit,
        pendingDues,
        refundEstimate: Math.max(0, deposit - pendingDues)
      };
    }
  }));

  requestExitMutation = injectMutation(() => ({
    mutationFn: async () => {
      const data = this.exitQuery.data();
      if (!data?.tenancyId) throw new Error('No tenancy available for exit request.');

      const desiredMoveOutDate = new Date();
      desiredMoveOutDate.setDate(desiredMoveOutDate.getDate() + 30);

      return await firstValueFrom(this.api.exit.createRequest({
        tenancyId: data.tenancyId,
        desiredMoveOutDate: desiredMoveOutDate.toISOString(),
        reason: 'Tenant initiated move out',
        comments: 'Requested via frontend workflow',
      }));
    },
    onSuccess: () => {
      this.toast.success('Exit request submitted successfully.');
      this.queryClient.invalidateQueries({ queryKey: ['exit-workflow'] });
    },
    onError: (error: any) => {
      this.toast.error(error.message || 'Failed to submit exit request.');
    }
  }));

  settlement = computed(() => {
    const data = this.exitQuery.data();
    if (!data) return { deposit: 0, pendingDues: 0, refundEstimate: 0 };
    return {
      deposit: data.deposit,
      pendingDues: data.pendingDues,
      refundEstimate: data.refundEstimate
    };
  });

  steps = computed(() => {
    const data = this.exitQuery.data();
    const status = data ? data.status : 'NOT_REQUESTED';
    
    return [
      { title: 'Notice Period Validation', description: 'Checks lease notice period and earliest move-out date.', done: status !== 'NOT_REQUESTED', icon: DoorOpen },
      { title: 'Final Dues Calculation', description: 'Combines rent balance, maintenance, penalties, and utility adjustments.', done: !['NOT_REQUESTED', 'REQUESTED'].includes(status), icon: Banknote },
      { title: 'Move-out Inspection', description: 'Captures condition photos and compares against move-in baseline.', done: ['INSPECTION_IN_PROGRESS', 'SETTLEMENT_PENDING', 'CLOSED'].includes(status), icon: ClipboardCheck },
      { title: 'Closure Certificate', description: 'Final settlement PDF and document archive after approval.', done: status === 'CLOSED', icon: FileSignature },
    ];
  });
}
