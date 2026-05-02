import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Banknote, ClipboardCheck, DoorOpen, FileSignature, ShieldAlert } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { ToastService } from '../../core/services/toast.service';
import { assertObject, readArray, readNumber, readString } from '../../core/api/request-validation';
import { createRequestState } from '../../core/services/request-state.service';

@Component({
  selector: 'app-exit-management',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-8 pb-20">
      <div *ngIf="error()" class="border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
        {{ error() }}
      </div>

      <div *ngIf="loading()" class="border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
        Syncing exit workflow...
      </div>

      <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p class="text-xs font-black text-indigo-600 uppercase tracking-widest">POST /exits · deposit settlement engine</p>
          <h1 class="text-4xl font-black text-slate-950 tracking-tight mt-2">Exit Management</h1>
          <p class="text-slate-500 font-semibold mt-2">Notice validation, final dues, move-out inspection, damage assessment, and closure.</p>
        </div>
        <button (click)="requestExit()" class="bg-rose-600 text-white px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest">Request Exit</button>
      </header>

      <section class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div class="space-y-4">
            <div *ngFor="let step of steps; let index = index" class="flex gap-4 p-4 rounded-xl border border-slate-100">
              <div class="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                   [ngClass]="step.done ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'">
                <lucide-icon [name]="step.icon" size="21"></lucide-icon>
              </div>
              <div class="grow">
                <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Step {{index + 1}}</p>
                <h3 class="font-black text-slate-900">{{step.title}}</h3>
                <p class="text-sm text-slate-500 font-medium mt-1">{{step.description}}</p>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest self-start px-3 py-1 rounded-full"
                    [ngClass]="step.done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
                {{step.done ? 'DONE' : 'PENDING'}}
              </span>
            </div>
          </div>
        </div>

        <aside class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div class="w-12 h-12 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-5">
            <lucide-icon [name]="AlertIcon" size="24"></lucide-icon>
          </div>
          <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Settlement Preview</p>
          <div class="space-y-4 mt-5">
            <div class="flex justify-between">
              <span class="text-sm text-slate-500 font-bold">Deposit</span>
              <span class="font-black text-slate-900">₹{{ settlement().deposit | number }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-slate-500 font-bold">Pending dues</span>
              <span class="font-black text-rose-600">₹{{ settlement().pendingDues | number }}</span>
            </div>
            <div class="flex justify-between pt-4 border-t border-slate-100">
              <span class="text-sm text-slate-500 font-bold">Refund estimate</span>
              <span class="font-black text-emerald-600">₹{{ settlement().refundEstimate | number }}</span>
            </div>
          </div>
        </aside>
      </section>
    </div>
  `
})
export class ExitManagementComponent implements OnInit {
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);
  private readonly state = createRequestState<unknown>(null);

  readonly AlertIcon = ShieldAlert;

  private tenancyId = signal<string | null>(null);
  settlement = signal({ deposit: 0, pendingDues: 0, refundEstimate: 0 });
  loading = this.state.loading;
  error = this.state.error;

  steps = [
    { title: 'Notice Period Validation', description: 'Checks lease notice period and earliest move-out date.', done: true, icon: DoorOpen },
    { title: 'Final Dues Calculation', description: 'Combines rent balance, maintenance, penalties, and utility adjustments.', done: false, icon: Banknote },
    { title: 'Move-out Inspection', description: 'Captures condition photos and compares against move-in baseline.', done: false, icon: ClipboardCheck },
    { title: 'Closure Certificate', description: 'Final settlement PDF and document archive after approval.', done: false, icon: FileSignature }
  ];

  async ngOnInit(): Promise<void> {
    const response = await this.state.runObservable(this.api.tenant.tenancies(), {
      errorMessage: 'Failed to load tenant tenancies.',
    });

    if (!response) {
      this.toast.error(this.error() ?? 'Failed to load tenant tenancies.');
      return;
    }

    assertObject(response, 'tenant tenancies response');
    const tenancies = readArray(response['tenancies']);
    const firstTenancy = tenancies[0] && typeof tenancies[0] === 'object'
      ? (tenancies[0] as Record<string, unknown>)
      : null;
    const tenancyId = firstTenancy ? readString(firstTenancy['id']) : '';

    if (!tenancyId) {
      return;
    }

    this.tenancyId.set(tenancyId);
    await this.loadExitRequest(tenancyId);
  }

  async requestExit() {
    const tenancyId = this.tenancyId();
    if (!tenancyId) {
      this.toast.warning('No tenancy available for exit request.');
      return;
    }

    const desiredMoveOutDate = new Date();
    desiredMoveOutDate.setDate(desiredMoveOutDate.getDate() + 30);

    const result = await this.state.runObservable(this.api.exit.createRequest({
      tenancyId,
      desiredMoveOutDate: desiredMoveOutDate.toISOString(),
      reason: 'Tenant initiated move out',
      comments: 'Requested via frontend workflow',
    }), {
      errorMessage: 'Failed to submit exit request.',
      successMessage: 'Exit request submitted.',
      preserveSuccess: true,
    });

    if (!result) {
      this.toast.error(this.error() ?? 'Failed to submit exit request.');
      return;
    }

    this.toast.success(this.state.success() ?? 'Exit request submitted.');
    await this.loadExitRequest(tenancyId);
  }

  private async loadExitRequest(tenancyId: string): Promise<void> {
    const response = await this.state.runObservable(this.api.exit.getByTenancy(tenancyId), {
      errorMessage: 'Unable to fetch exit request details.',
      preserveSuccess: true,
    });

    if (!response) {
      return;
    }

    assertObject(response, 'exit response');
    const exitRequest = response['exitRequest'] && typeof response['exitRequest'] === 'object'
      ? (response['exitRequest'] as Record<string, unknown>)
      : {};

    const status = readString(exitRequest['status'], 'REQUESTED');
    this.steps = [
      { title: 'Notice Period Validation', description: 'Checks lease notice period and earliest move-out date.', done: true, icon: DoorOpen },
      { title: 'Final Dues Calculation', description: 'Combines rent balance, maintenance, penalties, and utility adjustments.', done: status !== 'REQUESTED', icon: Banknote },
      { title: 'Move-out Inspection', description: 'Captures condition photos and compares against move-in baseline.', done: ['INSPECTION_IN_PROGRESS', 'SETTLEMENT_PENDING', 'CLOSED'].includes(status), icon: ClipboardCheck },
      { title: 'Closure Certificate', description: 'Final settlement PDF and document archive after approval.', done: status === 'CLOSED', icon: FileSignature },
    ];

    const deposit = readNumber(exitRequest['securityDepositHeld'], 0);
    const pendingDues = readNumber(exitRequest['pendingDuesAmount'], 0);
    this.settlement.set({
      deposit,
      pendingDues,
      refundEstimate: Math.max(0, deposit - pendingDues),
    });
  }
}
