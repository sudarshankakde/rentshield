import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ShieldAlert, Scale, Info, Plus, Filter, MessageSquareWarning } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { assertObject, readArray, readString } from '../../core/api/request-validation';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

interface Dispute {
  id: string;
  title: string;
  category: string;
  date: string;
  status: string;
}

@Component({
  selector: 'app-dispute-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-8 max-w-5xl mx-auto pb-20">
      
      <!-- Loading State -->
      <div *ngIf="disputesQuery.isLoading()" class="h-64 rounded-[3rem] bg-surface-soft border border-muted animate-pulse flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin"></div>
          <p class="text-sm font-bold text-muted-var uppercase tracking-widest">Loading dispute records...</p>
        </div>
      </div>

      <div *ngIf="disputesQuery.error() as error" class="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700 shadow-sm flex items-center gap-3">
        <lucide-icon [name]="FilterIcon" size="20"></lucide-icon>
        {{ error.message || 'Failed to load disputes.' }}
      </div>

      <div *ngIf="!disputesQuery.isLoading() && !disputesQuery.error()" class="bg-surface/80 backdrop-blur-xl p-8 lg:p-12 rounded-[3rem] border border-border shadow-xl relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div class="flex items-center gap-3 mb-2">
               <div class="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner">
                 <lucide-icon [name]="ScaleIcon" size="20"></lucide-icon>
               </div>
               <p class="text-brand font-bold uppercase tracking-widest text-[10px] drop-shadow-sm">Mediation & Escrow Safeguards</p>
            </div>
            <h2 class="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Dispute Protection</h2>
          </div>
          <button class="group relative overflow-hidden bg-gradient-to-r from-rose-500 to-rose-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 transition-all hover:-translate-y-1 hover:shadow-rose-500/40 flex items-center gap-2">
             <span class="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -translate-x-full"></span>
             <span class="relative z-10 flex items-center gap-2">
               <lucide-icon [name]="PlusIcon" size="16"></lucide-icon>
               Raise New Dispute
             </span>
          </button>
        </div>

        <div class="relative z-10 grid gap-4">
          <div *ngFor="let d of filteredDisputes()" class="group p-6 bg-surface-soft border border-border rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-xl hover:border-rose-500/30 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
            
            <div class="absolute top-0 left-0 w-1.5 h-full opacity-80" 
                 [ngClass]="d.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-rose-500'"></div>
            
            <div class="flex flex-col md:flex-row md:items-center gap-6 mb-4 md:mb-0 ml-2">
               <div class="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center text-text-muted border border-border group-hover:bg-rose-500/10 group-hover:text-rose-500 group-hover:border-rose-500/20 transition-all duration-300 shadow-sm shrink-0">
                  <lucide-icon [name]="ShieldAlertIcon" size="24"></lucide-icon>
               </div>
               <div>
                  <div class="flex items-center gap-3 mb-2">
                    <span class="text-[9px] font-black px-2.5 py-1 bg-surface border border-border text-text-muted rounded-full uppercase tracking-widest shadow-sm">ID: {{d.id.slice(0, 8)}}</span>
                    <span class="text-[9px] font-black px-2.5 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full uppercase tracking-widest">{{d.category}}</span>
                    <span class="text-[10px] font-black text-text-soft uppercase tracking-widest">{{d.date}}</span>
                  </div>
                  <h3 class="font-black text-text text-xl tracking-tight group-hover:text-rose-500 transition-colors">{{d.title}}</h3>
               </div>
            </div>
            
            <div class="text-right shrink-0 ml-2 md:ml-0">
               <span class="text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-full border shadow-sm flex items-center justify-center gap-2" 
                     [ngClass]="d.status === 'RESOLVED' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/10' : 'border-rose-500/20 text-rose-500 bg-rose-500/10'">
                 <div class="w-1.5 h-1.5 rounded-full" [ngClass]="d.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'"></div>
                 {{d.status}}
               </span>
            </div>
          </div>
          
          <!-- Empty State -->
          <div *ngIf="filteredDisputes().length === 0" class="py-16 text-center flex flex-col items-center">
             <div class="w-24 h-24 bg-surface-soft text-text-soft rounded-[2rem] flex items-center justify-center mb-6 border border-border shadow-inner">
               <lucide-icon [name]="MessageSquareWarningIcon" size="48"></lucide-icon>
            </div>
            <h3 class="text-2xl font-black text-text tracking-tight mb-2">No disputes found</h3>
            <p class="text-text-muted font-bold text-sm">Everything is running smoothly!</p>
          </div>
        </div>

        <!-- Info Tip -->
        <div class="mt-12 p-6 bg-surface border border-dashed border-border rounded-[2rem] flex flex-col sm:flex-row items-center gap-6 shadow-sm relative z-10">
           <div class="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20">
             <lucide-icon [name]="InfoIcon" size="24"></lucide-icon>
           </div>
           <p class="text-text-muted font-bold text-sm leading-relaxed text-center sm:text-left">
             Only raise a dispute for unresolved maintenance or agreement violations. High-priority cases are resolved by our moderation team within 48 hours.
           </p>
        </div>
      </div>
    </div>
  `
})
export class DisputeListComponent {
  private readonly api = inject(RentShieldApiService);

  readonly ShieldAlertIcon = ShieldAlert;
  readonly ScaleIcon = Scale;
  readonly InfoIcon = Info;
  readonly PlusIcon = Plus;
  readonly FilterIcon = Filter;
  readonly MessageSquareWarningIcon = MessageSquareWarning;

  disputesQuery = injectQuery(() => ({
    queryKey: ['dispute-list'],
    queryFn: async () => {
      const response = await firstValueFrom(this.api.disputes.list());
      return this.mapDisputes(response);
    }
  }));

  filteredDisputes = computed(() => this.disputesQuery.data() || []);

  private mapDisputes(payload: unknown): Dispute[] {
    assertObject(payload, 'disputes response');
    const rows = readArray(payload['disputes']);

    return rows.map((row, index) => {
      const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        id: readString(item['id'], String(index + 1)),
        title: readString(item['description'], 'Dispute Case'),
        category: readString(item['categoryId'], 'General'),
        date: readString(item['createdAt'], new Date().toISOString().split('T')[0]),
        status: readString(item['status'], 'OPEN'),
      };
    });
  }
}
