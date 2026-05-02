import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FileText, Download, ShieldCheck, Search, Filter, PenTool, FileSignature } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { readArray, readString } from '../../core/api/request-validation';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

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
    <div class="space-y-10 max-w-6xl mx-auto pb-20">
      
      <!-- Loading State -->
      <div *ngIf="agreementsQuery.isLoading()" class="h-64 rounded-[3rem] bg-surface-soft border border-muted animate-pulse flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin"></div>
          <p class="text-sm font-bold text-muted-var uppercase tracking-widest">Loading smart agreements...</p>
        </div>
      </div>

      <div *ngIf="agreementsQuery.error() as error" class="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700 shadow-sm flex items-center gap-3">
        <lucide-icon [name]="FilterIcon" size="20"></lucide-icon>
        {{ error.message || 'Failed to load agreement templates.' }}
      </div>

      <div *ngIf="!agreementsQuery.isLoading() && !agreementsQuery.error()" class="bg-surface/80 backdrop-blur-xl p-8 lg:p-12 rounded-[3rem] border border-border shadow-xl relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 class="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Smart Agreements</h2>
            <p class="text-brand font-bold uppercase tracking-widest text-[10px] mt-2 drop-shadow-sm">Legally Binding & Digitally Verified</p>
          </div>
          <button class="group relative overflow-hidden bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:-translate-y-1 hover:shadow-brand/30 flex items-center gap-2">
             <span class="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -translate-x-full"></span>
             <span class="relative z-10 flex items-center gap-2">
               <lucide-icon [name]="PenIcon" size="16"></lucide-icon>
               Draft New Agreement
             </span>
          </button>
        </div>

        <!-- Search & Filter Bar -->
        <div class="relative z-10 flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div class="relative grow group">
            <lucide-icon [name]="SearchIcon" class="absolute left-5 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-brand-primary transition-colors" size="18"></lucide-icon>
            <input 
              type="text" 
              [ngModel]="searchQuery()" 
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search by ID or title..." 
              class="w-full pl-14 pr-6 py-4 bg-surface-soft border border-border focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 rounded-2xl font-bold text-text transition-all outline-none text-sm shadow-inner">
          </div>
          
          <div class="flex items-center gap-2 p-1.5 bg-surface-muted rounded-2xl border border-border">
            <button 
              *ngFor="let s of ['All', 'Active', 'Pending', 'Expired']"
              (click)="selectedStatus.set(s)"
              class="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              [ngClass]="selectedStatus() === s ? 'bg-surface text-brand-primary shadow-md border border-border' : 'text-text-muted hover:text-text'">
              {{s}}
            </button>
          </div>
        </div>

        <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div *ngFor="let a of filteredAgreements()" 
               class="p-6 bg-surface-soft border border-border rounded-[2.5rem] shadow-sm flex flex-col justify-between hover:border-brand-primary/30 hover:shadow-xl hover:shadow-brand-primary/10 transition-all duration-300 group hover:-translate-y-1">
            
            <div class="flex items-start justify-between mb-6">
               <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-brand-primary/10 to-transparent border border-brand-primary/20 text-brand-primary flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-transform">
                     <lucide-icon [name]="FileSignatureIcon" size="24"></lucide-icon>
                  </div>
                  <div>
                     <h3 class="text-xl font-black text-text tracking-tight group-hover:text-brand-primary transition-colors">{{a.title}}</h3>
                     <p class="text-text-muted text-xs font-bold tracking-tight mt-1">ID: #{{a.id}}</p>
                  </div>
               </div>
               <span class="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm"
                     [ngClass]="{
                       'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20': a.status === 'Active',
                       'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20': a.status === 'Pending',
                       'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20': a.status === 'Expired'
                     }">
                 {{a.status}}
               </span>
            </div>
            
            <div class="flex items-center justify-between border-t border-border pt-5">
               <div class="flex flex-col">
                  <span class="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Last Updated</span>
                  <span class="text-xs font-bold text-text flex items-center gap-1.5">
                     <lucide-icon *ngIf="a.verified" [name]="ShieldIcon" size="12" class="text-emerald-500"></lucide-icon>
                     {{a.expiry}}
                  </span>
               </div>
               
               <div class="flex items-center gap-2">
                  <button class="w-10 h-10 rounded-xl bg-surface border border-border text-text-muted flex items-center justify-center hover:bg-surface-soft hover:text-brand-primary transition-colors shadow-sm">
                     <lucide-icon [name]="DownloadIcon" size="16"></lucide-icon>
                  </button>
                  <button class="px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:scale-105 transition-transform shadow-md">
                     View
                  </button>
               </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="filteredAgreements().length === 0" class="col-span-full py-20 text-center flex flex-col items-center">
             <div class="w-24 h-24 bg-surface-soft text-text-soft rounded-[2rem] flex items-center justify-center mb-6 border border-border shadow-inner">
               <lucide-icon [name]="FileTextIcon" size="48"></lucide-icon>
            </div>
            <h3 class="text-2xl font-black text-text tracking-tight mb-2">No agreements found</h3>
            <p class="text-text-muted font-bold text-sm">Adjust your filters or search query.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AgreementListComponent {
  private readonly api = inject(RentShieldApiService);

  readonly FileTextIcon = FileText;
  readonly DownloadIcon = Download;
  readonly ShieldIcon = ShieldCheck;
  readonly SearchIcon = Search;
  readonly FilterIcon = Filter;
  readonly PenIcon = PenTool;
  readonly FileSignatureIcon = FileSignature;

  searchQuery = signal('');
  selectedStatus = signal('All');

  agreementsQuery = injectQuery(() => ({
    queryKey: ['agreements-list'],
    queryFn: async () => {
      const response = await firstValueFrom(this.api.agreements.templates());
      return this.mapTemplates(response);
    }
  }));

  filteredAgreements = computed(() => {
    const agreements = this.agreementsQuery.data() || [];
    return agreements.filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(this.searchQuery().toLowerCase()) || 
                            a.id.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchesStatus = this.selectedStatus() === 'All' || a.status === this.selectedStatus();
      return matchesSearch && matchesStatus;
    });
  });

  private mapTemplates(payload: unknown): Agreement[] {
    const obj = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
    const rows = readArray(obj['templates']);

    return rows.map((row, index) => {
      const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        id: readString(item['id'], 'TEMPLATE-' + (index + 1)),
        title: readString(item['name']) || readString(item['title'], 'Agreement Template'),
        expiry: readString(item['updatedAt'], 'N/A'),
        verified: true,
        status: 'Active',
      } as Agreement;
    });
  }
}
