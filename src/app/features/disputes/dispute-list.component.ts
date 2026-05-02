import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { ToastService } from '../../core/services/toast.service';
import { assertObject, readArray, readString } from '../../core/api/request-validation';
import { createRequestState } from '../../core/services/request-state.service';

@Component({
  selector: 'app-dispute-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 max-w-4xl mx-auto">
      <div *ngIf="error()" class="border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
        {{ error() }}
      </div>

      <div *ngIf="loading()" class="border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
        Loading disputes...
      </div>

      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-3xl font-black text-slate-900 tracking-tight">Dispute Protection</h2>
          <p class="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Mediation & Escrow Safeguards</p>
        </div>
        <button class="bg-[#ff5b14] text-white px-8 py-3 rounded-2xl font-black text-lg shadow-xl shadow-orange-100 hover:scale-105 transition-transform active:scale-95">
          Raise New Dispute
        </button>
      </div>

      <div class="grid gap-4">
          <div *ngFor="let d of disputes()" class="group p-8 bg-white border border-slate-100 rounded-4xl flex items-center justify-between shadow-sm hover:shadow-xl hover:border-slate-200 transition-all">
          <div class="flex items-center gap-6">
             <div class="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                <span class="text-lg font-black">#{{d.id}}</span>
             </div>
             <div>
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-[10px] font-black px-3 py-1 bg-orange-50 text-orange-600 rounded-full uppercase tracking-widest">{{d.category}}</span>
                  <span class="text-[11px] font-black text-slate-300 uppercase tracking-widest">{{d.date}}</span>
                </div>
                <h3 class="font-black text-slate-900 text-xl tracking-tight">{{d.title}}</h3>
             </div>
          </div>
          <div class="text-right">
             <span class="text-[11px] font-black uppercase tracking-[0.2em] px-5 py-2 rounded-full border-2" 
                   [ngClass]="d.status === 'In Review' ? 'border-amber-100 text-amber-500 bg-amber-50' : 'border-emerald-100 text-emerald-500 bg-emerald-50'">
               {{d.status}}
             </span>
          </div>
        </div>
      </div>

      <!-- Empty state tip -->
      <div class="p-8 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
         <p class="text-slate-400 font-bold text-sm">Only raise a dispute for unresolved maintenance or agreement violations. High-priority cases are resolved within 48 hours.</p>
      </div>
    </div>
  `
})
export class DisputeListComponent implements OnInit {
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);
  private readonly state = createRequestState<unknown>(null);

  disputes = signal<Array<{ id: string; title: string; category: string; date: string; status: string }>>([]);
  loading = this.state.loading;
  error = this.state.error;

  async ngOnInit(): Promise<void> {
    const response = await this.state.runObservable(this.api.disputes.list(), {
      errorMessage: 'Failed to load disputes.',
    });

    if (!response) {
      this.toast.error(this.error() ?? 'Failed to load disputes.');
      return;
    }

    this.disputes.set(this.mapDisputes(response));
  }

  private mapDisputes(payload: unknown): Array<{ id: string; title: string; category: string; date: string; status: string }> {
    assertObject(payload, 'disputes response');
    const rows = readArray(payload['disputes']);

    return rows.map((row, index) => {
      const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        id: readString(item['id'], String(index + 1)),
        title: readString(item['description'], 'Dispute'),
        category: readString(item['categoryId'], 'General'),
        date: readString(item['createdAt'], 'N/A'),
        status: readString(item['status'], 'OPEN'),
      };
    });
  }
}
