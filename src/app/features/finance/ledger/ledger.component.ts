import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { RentShieldApiService } from '../../../core/api/rentshield-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { readArray, readNumber, readString } from '../../../core/api/request-validation';
import { createRequestState } from '../../../core/services/request-state.service';

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [CommonModule, AgGridModule],
  template: `
    <div class="space-y-6">
      <div *ngIf="error()" class="border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
        {{ error() }}
      </div>

      <div *ngIf="loading()" class="border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
        Loading ledger entries...
      </div>

      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-900">Financial Ledger</h2>
          <p class="text-slate-500 text-sm">Transaction history, rent receivables and quick summaries</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-sm text-slate-500 mr-2">Showing recent 50 records</div>
          <button class="px-4 py-2 border border-slate-200 rounded-lg bg-white font-medium hover:bg-slate-50 transition-colors">Export CSV</button>
          <button class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">Add Transaction</button>
        </div>
      </div>

      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-100">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <div class="text-xs text-slate-500 uppercase font-black tracking-widest">Ledger Overview</div>
          <div class="flex items-center gap-4">
            <div class="text-sm font-black text-emerald-600">Total Received: ₹<span>{{ totalReceived() | number }}</span></div>
            <div class="text-sm font-black text-rose-600">Total Paid: ₹<span>{{ totalPaid() | number }}</span></div>
          </div>
        </div>

        <ag-grid-angular
          class="ag-theme-alpine w-full h-130 md:h-150"
          [rowData]="rowData"
          [columnDefs]="columnDefs"
          [defaultColDef]="defaultColDef">
        </ag-grid-angular>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .ag-theme-alpine {
      --ag-border-color: #E2E8F0;
      --ag-header-background-color: #F1F5F9;
      --ag-odd-row-background-color: #ffffff;
      --ag-header-foreground-color: #64748B;
      --ag-header-cell-hover-background-color: #F1F5F9;
      --ag-font-family: var(--font-mono);
      --ag-font-size: 13px;
    }
    :host ::ng-deep .ag-header-cell-label {
      @apply uppercase tracking-widest text-[11px] font-bold;
    }
  `]
})
export class LedgerComponent implements OnInit {
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);
  private readonly state = createRequestState<unknown>(null);

  columnDefs: ColDef[] = [
    { field: 'date', headerName: 'DATE', width: 120 },
    { field: 'description', headerName: 'PARTICULARS', flex: 1, cellStyle: { fontWeight: '600', fontFamily: 'var(--font-sans)' } },
    { field: 'type', headerName: 'TYPE', width: 100, cellClassRules: {
      'text-emerald-500 font-bold': "data.type === 'CREDIT'",
      'text-rose-500 font-bold': "data.type === 'DEBIT'"
    }},
    { field: 'category', headerName: 'CATEGORY', width: 130 },
    { field: 'amount', headerName: 'AMOUNT', width: 140, valueFormatter: params => '₹' + params.value.toLocaleString() },
    { field: 'status', headerName: 'STATUS', width: 110, cellRenderer: (params: any) => `
      <span class="technical-badge inline-flex items-center h-6 ${params.value === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">
        ${params.value}
      </span>
    `}
  ];

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  rowData: Array<{ date: string; description: string; type: string; category: string; amount: number; status: string }> = [];
  loading = this.state.loading;
  error = this.state.error;

  async ngOnInit(): Promise<void> {
    const response = await this.state.runObservable(this.api.payments.due(), {
      errorMessage: 'Failed to load payment ledger.',
    });

    if (!response) {
      this.toast.error(this.error() ?? 'Failed to load payment ledger.');
      return;
    }

    this.rowData = this.mapRows(response);
  }

  private mapRows(payload: unknown): Array<{ date: string; description: string; type: string; category: string; amount: number; status: string }> {
    // Backend GET /payments/due returns a raw array directly
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
        status: readString(item['status'], 'Pending'),
      };
    });
  }

  totalReceived(): number {
    return this.rowData.filter(r => r.type === 'CREDIT').reduce((s, r) => s + (r.amount || 0), 0);
  }

  totalPaid(): number {
    return this.rowData.filter(r => r.type === 'DEBIT').reduce((s, r) => s + (r.amount || 0), 0);
  }
}
