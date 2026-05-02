import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { LucideAngularModule, Filter, Download, Plus, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-angular';
import { RentShieldApiService } from '../../../core/api/rentshield-api.service';
import { readArray, readNumber, readString } from '../../../core/api/request-validation';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [CommonModule, AgGridModule, LucideAngularModule],
  template: `
    <div class="space-y-8 max-w-6xl mx-auto pb-20">
      
      <!-- Loading State -->
      <div *ngIf="ledgerQuery.isLoading()" class="h-64 rounded-[3rem] bg-surface-soft border border-muted animate-pulse flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin"></div>
          <p class="text-sm font-bold text-muted-var uppercase tracking-widest">Loading ledger entries...</p>
        </div>
      </div>

      <div *ngIf="ledgerQuery.error() as error" class="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700 shadow-sm flex items-center gap-3">
        <lucide-icon [name]="FilterIcon" size="20"></lucide-icon>
        {{ error.message || 'Failed to load payment ledger.' }}
      </div>

      <div *ngIf="!ledgerQuery.isLoading() && !ledgerQuery.error()" class="bg-surface/80 backdrop-blur-xl p-8 lg:p-12 rounded-[3rem] border border-border shadow-xl relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div class="flex items-center gap-3 mb-2">
               <div class="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20">
                 <lucide-icon [name]="WalletIcon" size="20"></lucide-icon>
               </div>
               <p class="text-brand font-bold uppercase tracking-widest text-[10px] drop-shadow-sm">Finance Module</p>
            </div>
            <h2 class="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Financial Ledger</h2>
            <p class="text-muted-var font-semibold mt-2 max-w-xl text-sm leading-relaxed">Transaction history, rent receivables, and automated reconciliations.</p>
          </div>
          <div class="flex items-center gap-3">
            <button class="w-12 h-12 rounded-2xl border border-border text-text-muted flex items-center justify-center hover:bg-surface-soft hover:text-brand-primary transition-colors shadow-sm group">
               <lucide-icon [name]="DownloadIcon" size="20" class="group-hover:-translate-y-1 transition-transform"></lucide-icon>
            </button>
            <button class="group relative overflow-hidden bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:-translate-y-1 hover:shadow-brand/30 flex items-center gap-2">
               <span class="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -translate-x-full"></span>
               <span class="relative z-10 flex items-center gap-2">
                 <lucide-icon [name]="PlusIcon" size="16"></lucide-icon>
                 Add Transaction
               </span>
            </button>
          </div>
        </div>

        <!-- Ledger Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 relative z-10">
          <div class="p-6 rounded-[2rem] bg-surface-soft border border-border flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
             <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                <lucide-icon [name]="ArrowUpIcon" size="24"></lucide-icon>
             </div>
             <div>
                <p class="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Total Received</p>
                <p class="text-3xl font-black text-emerald-500 tracking-tight">₹{{ totalReceived() | number }}</p>
             </div>
          </div>
          
          <div class="p-6 rounded-[2rem] bg-surface-soft border border-border flex items-center gap-6 shadow-sm hover:shadow-md transition-shadow">
             <div class="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-inner">
                <lucide-icon [name]="ArrowDownIcon" size="24"></lucide-icon>
             </div>
             <div>
                <p class="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Total Due</p>
                <p class="text-3xl font-black text-rose-500 tracking-tight">₹{{ totalPaid() | number }}</p>
             </div>
          </div>
        </div>

        <div class="relative z-10 bg-surface rounded-[2rem] border border-border shadow-inner overflow-hidden p-2">
          <ag-grid-angular
            class="ag-theme-alpine w-full h-[500px]"
            [rowData]="rowData()"
            [columnDefs]="columnDefs"
            [defaultColDef]="defaultColDef">
          </ag-grid-angular>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .ag-theme-alpine {
      --ag-border-color: transparent;
      --ag-header-background-color: transparent;
      --ag-odd-row-background-color: var(--surface-soft);
      --ag-row-hover-color: var(--surface-muted);
      --ag-header-foreground-color: var(--text-muted);
      --ag-header-cell-hover-background-color: transparent;
      --ag-font-family: var(--font-sans);
      --ag-font-size: 14px;
      --ag-foreground-color: var(--text);
      --ag-background-color: var(--surface);
    }
    :host ::ng-deep .ag-header-cell-label {
      @apply uppercase tracking-widest text-[10px] font-black text-text-muted;
    }
    :host ::ng-deep .ag-row {
      @apply border-b border-border transition-colors duration-200;
    }
    :host ::ng-deep .ag-cell {
      @apply flex items-center font-bold text-sm;
    }
    :host ::ng-deep .ag-root-wrapper {
      @apply border-0;
    }
  `]
})
export class LedgerComponent {
  private readonly api = inject(RentShieldApiService);

  readonly FilterIcon = Filter;
  readonly DownloadIcon = Download;
  readonly PlusIcon = Plus;
  readonly WalletIcon = Wallet;
  readonly ArrowUpIcon = ArrowUpRight;
  readonly ArrowDownIcon = ArrowDownRight;

  columnDefs: ColDef[] = [
    { field: 'date', headerName: 'DATE', width: 140 },
    { field: 'description', headerName: 'PARTICULARS', flex: 1, cellStyle: { fontWeight: '900' } },
    { field: 'type', headerName: 'TYPE', width: 120, cellRenderer: (params: any) => `
      <span class="inline-flex items-center text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${params.value === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}">
        ${params.value}
      </span>
    `},
    { field: 'category', headerName: 'CATEGORY', width: 150 },
    { field: 'amount', headerName: 'AMOUNT', width: 150, cellClass: 'font-black', valueFormatter: params => '₹' + params.value.toLocaleString() },
    { field: 'status', headerName: 'STATUS', width: 130, cellRenderer: (params: any) => `
      <span class="inline-flex items-center text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${params.value === 'COMPLETED' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}">
        ${params.value}
      </span>
    `}
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  ledgerQuery = injectQuery(() => ({
    queryKey: ['ledger-entries'],
    queryFn: async () => {
      const response = await firstValueFrom(this.api.payments.due());
      return this.mapRows(response);
    }
  }));

  rowData = computed(() => this.ledgerQuery.data() || []);

  private mapRows(payload: unknown): Array<{ date: string; description: string; type: string; category: string; amount: number; status: string }> {
    const rows = Array.isArray(payload)
      ? payload
      : (payload && typeof payload === 'object' ? readArray((payload as Record<string,unknown>)['payments'] ?? (payload as Record<string,unknown>)['data']) : []);

    return rows.map((row) => {
      const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      const amountPaid = readNumber(item['amountPaid'], 0);
      const isPaid = readString(item['status'], '') === 'COMPLETED';
      return {
        date: readString(item['dueDate'], readString(item['createdAt'], new Date().toISOString().slice(0, 10))),
        description: readString(item['label']) || readString(item['description'], 'Payment entry'),
        type: isPaid || amountPaid > 0 ? 'CREDIT' : 'DEBIT',
        category: readString(item['category'], 'Rent'),
        amount: readNumber(item['amount'], readNumber(item['balance'], 0)),
        status: isPaid ? 'COMPLETED' : readString(item['status'], 'PENDING'),
      };
    });
  }

  totalReceived = computed(() => {
    return this.rowData().filter(r => r.type === 'CREDIT').reduce((s, r) => s + (r.amount || 0), 0);
  });

  totalPaid = computed(() => {
    return this.rowData().filter(r => r.type === 'DEBIT').reduce((s, r) => s + (r.amount || 0), 0);
  });
}
