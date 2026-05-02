import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, CheckCircle2, Clock, Filter, Home, ArrowRight } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { assertObject, readArray, readString } from '../../core/api/request-validation';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

interface TimelineEvent {
  title: string;
  date: string;
  description: string;
  completed: boolean;
}

@Component({
  selector: 'app-slaas-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-8 max-w-5xl mx-auto pb-20">
      
      <!-- Loading State -->
      <div *ngIf="tenanciesQuery.isLoading()" class="h-64 rounded-[3rem] bg-surface-soft border border-muted animate-pulse flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin"></div>
          <p class="text-sm font-bold text-muted-var uppercase tracking-widest">Loading tenancy records...</p>
        </div>
      </div>

      <div *ngIf="tenanciesQuery.error() as error" class="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700 shadow-sm flex items-center gap-3">
        <lucide-icon [name]="FilterIcon" size="20"></lucide-icon>
        {{ error.message || 'Failed to load tenancies timeline.' }}
      </div>

      <div *ngIf="!tenanciesQuery.isLoading() && !tenanciesQuery.error()" class="bg-surface/80 backdrop-blur-xl p-8 lg:p-12 rounded-[3rem] border border-border shadow-xl relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 class="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Lease Timeline</h2>
            <p class="text-brand font-bold uppercase tracking-widest text-[10px] mt-2 drop-shadow-sm">Contract Life-cycle Monitoring</p>
          </div>
          
          <div class="flex flex-col sm:flex-row items-center gap-4">
             <div class="relative group w-full sm:w-auto">
                <lucide-icon [name]="SearchIcon" class="absolute left-4 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-brand-primary transition-colors" size="18"></lucide-icon>
                <input 
                  type="text" 
                  [ngModel]="searchQuery()" 
                  (ngModelChange)="searchQuery.set($event)"
                  placeholder="Search events..." 
                  class="pl-12 pr-6 py-3.5 bg-surface-soft border border-border focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 rounded-2xl w-full sm:w-64 font-bold text-text transition-all outline-none text-sm shadow-inner">
             </div>
             
             <div class="flex p-1.5 bg-surface-muted rounded-2xl border border-border w-full sm:w-auto justify-center">
                <button 
                  (click)="filterMode.set('all')"
                  class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  [class.bg-surface]="filterMode() === 'all'" [class.text-text]="filterMode() === 'all'" [class.shadow-md]="filterMode() === 'all'"
                  [class.text-text-muted]="filterMode() !== 'all'">
                  All
                </button>
                <button 
                  (click)="filterMode.set('completed')"
                  class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  [class.bg-surface]="filterMode() === 'completed'" [class.text-emerald-500]="filterMode() === 'completed'" [class.shadow-md]="filterMode() === 'completed'"
                  [class.text-text-muted]="filterMode() !== 'completed'">
                  Done
                </button>
                <button 
                  (click)="filterMode.set('pending')"
                  class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  [class.bg-surface]="filterMode() === 'pending'" [class.text-brand-primary]="filterMode() === 'pending'" [class.shadow-md]="filterMode() === 'pending'"
                  [class.text-text-muted]="filterMode() !== 'pending'">
                  Next
                </button>
             </div>
          </div>
        </div>
        
        <div class="relative border-l-4 border-surface-muted ml-6 pl-10 space-y-12 pb-6 z-10">
          <div *ngFor="let event of filteredEvents(); let last = last" class="relative group">
            
            <!-- Connector Dot -->
            <div class="absolute -left-[3.25rem] top-2 w-12 h-12 rounded-full border-8 border-surface shadow-lg flex items-center justify-center text-xs font-black transition-all z-20" 
                 [ngClass]="event.completed ? 'bg-emerald-500 text-white' : 'bg-surface-soft border-border text-text-muted group-hover:border-brand-primary group-hover:text-brand-primary'">
               <lucide-icon *ngIf="event.completed" [name]="CheckIcon" size="16"></lucide-icon>
               <lucide-icon *ngIf="!event.completed" [name]="ClockIcon" size="16"></lucide-icon>
            </div>

            <!-- Content Card -->
            <div class="p-8 bg-surface-soft border border-border rounded-3xl transition-all duration-300 hover:bg-surface hover:shadow-xl hover:-translate-y-1"
                 [ngClass]="event.completed ? 'hover:border-emerald-500/30 hover:shadow-emerald-500/10' : 'hover:border-brand-primary/30 hover:shadow-brand-primary/10'">
               <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <span class="text-[10px] uppercase font-black tracking-[0.2em] px-3 py-1.5 rounded-full border shadow-sm w-fit"
                        [ngClass]="{
                          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20': event.completed,
                          'bg-brand-primary/5 text-brand-primary border-brand-primary/20': !event.completed
                        }">
                    {{event.date}}
                  </span>
                  <span *ngIf="event.completed" class="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full">
                     <lucide-icon [name]="CheckIcon" size="12"></lucide-icon> Verified
                  </span>
                  <span *ngIf="!event.completed" class="text-[10px] font-black text-brand-primary uppercase tracking-widest flex items-center gap-1.5 bg-brand-primary/10 px-3 py-1 rounded-full">
                     <lucide-icon [name]="ArrowIcon" size="12"></lucide-icon> Upcoming
                  </span>
               </div>
               
               <h3 class="text-2xl font-black text-text tracking-tight transition-colors"
                   [ngClass]="event.completed ? 'group-hover:text-emerald-500' : 'group-hover:text-brand-primary'">
                 {{event.title}}
               </h3>
               <p class="text-text-muted text-sm mt-3 font-medium leading-relaxed max-w-2xl">{{event.description}}</p>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="filteredEvents().length === 0" class="flex flex-col items-center py-24 text-center">
             <div class="w-24 h-24 bg-surface-soft rounded-3xl flex items-center justify-center text-text-soft mb-6 shadow-inner border border-border">
                <lucide-icon [name]="HomeIcon" size="40"></lucide-icon>
             </div>
             <h3 class="text-2xl font-black text-text mb-2 tracking-tight">No events found</h3>
             <p class="text-text-muted font-medium text-sm max-w-sm">There are no timeline events matching your current filters or search.</p>
             <button *ngIf="searchQuery() || filterMode() !== 'all'" (click)="searchQuery.set(''); filterMode.set('all')" 
                     class="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary hover:text-brand-primary-dark transition-colors bg-brand-primary/10 px-4 py-2 rounded-full">
               Clear Filters
             </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SlassTimelineComponent {
  private readonly api = inject(RentShieldApiService);

  readonly SearchIcon = Search;
  readonly CheckIcon = CheckCircle2;
  readonly ClockIcon = Clock;
  readonly FilterIcon = Filter;
  readonly HomeIcon = Home;
  readonly ArrowIcon = ArrowRight;

  searchQuery = signal('');
  filterMode = signal<'all' | 'completed' | 'pending'>('all');

  tenanciesQuery = injectQuery(() => ({
    queryKey: ['tenancies-timeline'],
    queryFn: async () => {
      const response = await firstValueFrom(this.api.tenant.tenancies());
      return this.mapTimelineEvents(response);
    }
  }));

  filteredEvents = computed(() => {
    const events = this.tenanciesQuery.data() || [];
    return events.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(this.searchQuery().toLowerCase()) || 
                            e.description.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchesFilter = this.filterMode() === 'all' || 
                           (this.filterMode() === 'completed' && e.completed) || 
                           (this.filterMode() === 'pending' && !e.completed);
      return matchesSearch && matchesFilter;
    });
  });

  private mapTimelineEvents(payload: unknown): TimelineEvent[] {
    assertObject(payload, 'tenant tenancies response');
    const tenancies = readArray(payload['tenancies']);

    const events: TimelineEvent[] = [];
    for (const row of tenancies) {
      const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      const startDate = readString(item['startDate'], 'N/A');
      const endDate = readString(item['endDate'], 'N/A');
      const status = readString(item['status'], 'ACTIVE');
      const id = readString(item['id'], 'tenancy');

      events.push({
        title: 'Tenancy ' + id.slice(0, 8) + ' started',
        date: startDate,
        description: 'Lease has started and is currently marked as ' + status + '.',
        completed: true,
      });
      events.push({
        title: 'Scheduled tenancy end',
        date: endDate,
        description: 'Prepare for renewal or exit workflow before this date.',
        completed: false,
      });
    }

    if (events.length === 0) {
      return [
        {
          title: 'No active tenancy found',
          date: 'N/A',
          description: 'Create a tenancy to start lifecycle tracking.',
          completed: false,
        },
      ];
    }

    return events;
  }
}
