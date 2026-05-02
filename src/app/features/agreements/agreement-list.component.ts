import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FileText, Download, ShieldCheck, Search } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { ToastService } from '../../core/services/toast.service';
import { readArray, readString } from '../../core/api/request-validation';
import { createRequestState } from '../../core/services/request-state.service';

interface Agreement {
  id: string;
  title: string;
  expiry: string;
  verified: boolean;
  status: 'Active' | 'Pending' | 'Expired';
}

@Component({
  selector: 'app-agreement-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  template: `
    <div class="space-y-10 max-w-5xl mx-auto pb-20">
      <div *ngIf="error()" class="border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
        {{ error() }}
      </div>

      <div *ngIf="loading()" class="border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
        Loading agreements...
      </div>

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 class="text-4xl font-black text-slate-900 tracking-tight">Smart Agreements</h2>
          <p class="text-muted-var font-bold uppercase tracking-widest text-[10px] mt-2">Legally Binding & Digitally Verified</p>
        </div>
        <button class="px-8 py-4 rounded-2xl font-black text-lg shadow-brand btn-primary hover:scale-105 transition-transform active:scale-95 leading-none">
          Draft New Agreement
        </button>
      </div>

      <!-- Search & Filter Bar -->
      <div class="flex flex-col md:flex-row md:items-center gap-4">
        <div class="relative grow group">
          <lucide-icon [name]="SearchIcon" class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-var group-focus-within:text-brand transition-colors" size="18"></lucide-icon>
          <input 
            type="text" 
            [ngModel]="searchQuery()" 
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Search by ID or title..." 
            class="w-full pl-12 pr-6 py-4 bg-surface border border-muted rounded-3xl font-bold text text-muted-var focus:border-muted outline-none shadow-sm transition-all">
        </div>
        
        <div class="flex items-center gap-2 p-1.5 bg-slate-100 rounded-3xl border border-slate-200">
          <button 
            *ngFor="let s of ['All', 'Active', 'Pending', 'Expired']"
            (click)="selectedStatus.set(s)"
            class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            [ngClass]="selectedStatus() === s ? 'bg-surface text text-muted-var shadow-md' : 'text-muted-var'">
            {{s}}
          </button>
        </div>
      </div>

      <div class="space-y-4">
          <div *ngFor="let a of filteredAgreements()" class="p-8 bg-surface border border-muted rounded-[2.5rem] shadow-sm flex items-center justify-between hover:border-muted transition-all group">
          <div class="flex items-center gap-6">
             <div class="w-16 h-16 rounded-3xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <lucide-icon [name]="FileTextIcon" size="28"></lucide-icon>
             </div>
             <div>
                <div class="flex items-center gap-3 mb-1">
                   <h3 class="text-xl font-black text-slate-900 tracking-tight group-hover:text-orange-600 transition-colors">{{a.title}}</h3>
                   <span *ngIf="a.verified" class="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest toast-success px-2 py-0.5 rounded-full border">
                      <lucide-icon [name]="ShieldIcon" size="10"></lucide-icon>
                      Verified
                   </span>
                   <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                         [ngClass]="{
                           'status-active': a.status === 'Active',
                           'status-pending': a.status === 'Pending',
                           'status-expired': a.status === 'Expired'
                         }">
                     {{a.status}}
                   </span>
                </div>
                <p class="text-slate-400 text-sm font-bold tracking-tight">ID: #{{a.id}} • Expiring: {{a.expiry}}</p>
             </div>
          </div>
          <div class="flex items-center gap-3">
             <button class="w-12 h-12 rounded-2xl border border-muted text-muted-var flex items-center justify-center hover:bg-surface-soft transition-colors">
                <lucide-icon [name]="DownloadIcon" size="18"></lucide-icon>
             </button>
             <button class="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest btn-primary hover:bg-brand-dark transition-colors">
                View Contract
             </button>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredAgreements().length === 0" class="py-20 text-center flex flex-col items-center">
            <div class="w-20 h-20 bg-slate-50 text-slate-200 rounded-4xl flex items-center justify-center mb-6">
              <lucide-icon [name]="FileTextIcon" size="40"></lucide-icon>
           </div>
           <h3 class="text-xl font-black text-slate-900 tracking-tight">No agreements found</h3>
           <p class="text-slate-400 font-bold text-sm">Matching your search criteria</p>
        </div>
      </div>
    </div>
  `
})
export class AgreementListComponent implements OnInit {
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);
  private readonly state = createRequestState<unknown>(null);

  readonly FileTextIcon = FileText;
  readonly DownloadIcon = Download;
  readonly ShieldIcon = ShieldCheck;
  readonly SearchIcon = Search;

  searchQuery = signal('');
  selectedStatus = signal('All');

  agreements = signal<Agreement[]>([]);
  loading = this.state.loading;
  error = this.state.error;

  filteredAgreements = computed(() => {
    return this.agreements().filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(this.searchQuery().toLowerCase()) || 
                            a.id.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchesStatus = this.selectedStatus() === 'All' || a.status === this.selectedStatus();
      return matchesSearch && matchesStatus;
    });
  });

  async ngOnInit(): Promise<void> {
    const response = await this.state.runObservable(this.api.agreements.templates(), {
      errorMessage: 'Failed to load agreement templates.',
    });

    if (!response) {
      this.toast.error(this.error() ?? 'Failed to load agreement templates.');
      return;
    }

    this.agreements.set(this.mapTemplates(response));
  }

  private mapTemplates(payload: unknown): Agreement[] {
    // api.agreements.templates() now wraps response to { templates: [...] }
    const obj = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
    const rows = readArray(obj['templates']);

    return rows.map((row, index) => {
      const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        id: readString(item['id'], `TEMPLATE-${index + 1}`),
        title: readString(item['name']) || readString(item['title'], 'Agreement Template'),
        expiry: readString(item['updatedAt'], 'N/A'),
        verified: true,
        status: 'Active',
      } as Agreement;
    });
  }
}
