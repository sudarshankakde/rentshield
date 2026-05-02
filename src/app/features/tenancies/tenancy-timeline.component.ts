import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, CheckCircle2, Clock, Filter } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { ToastService } from '../../core/services/toast.service';
import { assertObject, readArray, readString } from '../../core/api/request-validation';
import { createRequestState } from '../../core/services/request-state.service';

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
    <div class="space-y-8 max-w-4xl pb-20">
      <div *ngIf="error()" class="border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
        {{ error() }}
      </div>

      <div *ngIf="loading()" class="border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
        Loading tenancy timeline...
      </div>

      <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 class="text-4xl font-black text-slate-900 tracking-tight">Lease Timeline</h2>
            <p class="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Contract Life-cycle Monitoring</p>
          </div>
          
          <div class="flex items-center gap-3">
             <div class="relative group">
                <lucide-icon [name]="SearchIcon" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size="16"></lucide-icon>
                <input 
                  type="text" 
                  [ngModel]="searchQuery()" 
                  (ngModelChange)="searchQuery.set($event)"
                  placeholder="Search events..." 
                  class="pl-11 pr-6 py-3 bg-slate-50 border border-transparent focus:border-emerald-500 focus:bg-white rounded-2xl w-full md:w-60 font-bold text-slate-900 transition-all outline-none text-sm">
             </div>
             <div class="flex p-1 bg-slate-50 rounded-xl border border-slate-100">
                <button 
                  (click)="filterMode.set('all')"
                  class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  [class.bg-white]="filterMode() === 'all'" [class.text-slate-900]="filterMode() === 'all'" [class.shadow-sm]="filterMode() === 'all'"
                  [class.text-slate-400]="filterMode() !== 'all'">
                  All
                </button>
                <button 
                  (click)="filterMode.set('completed')"
                  class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  [class.bg-white]="filterMode() === 'completed'" [class.text-emerald-600]="filterMode() === 'completed'" [class.shadow-sm]="filterMode() === 'completed'"
                  [class.text-slate-400]="filterMode() !== 'completed'">
                  Done
                </button>
                <button 
                  (click)="filterMode.set('pending')"
                  class="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  [class.bg-white]="filterMode() === 'pending'" [class.text-amber-600]="filterMode() === 'pending'" [class.shadow-sm]="filterMode() === 'pending'"
                  [class.text-slate-400]="filterMode() !== 'pending'">
                  Next
                </button>
             </div>
          </div>
        </div>
        
        <div class="relative border-l-4 border-slate-50 ml-4 pl-12 space-y-12 pb-4">
          <div *ngFor="let event of filteredEvents(); let last = last" class="relative group">
            <!-- Connector Dot -->
              <div class="absolute -left-14 top-0 w-10 h-10 rounded-full border-8 border-white shadow-lg flex items-center justify-center text-xs font-black transition-all" 
                 [ngClass]="event.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'">
               <lucide-icon *ngIf="event.completed" [name]="CheckIcon" size="14"></lucide-icon>
               <lucide-icon *ngIf="!event.completed" [name]="ClockIcon" size="14"></lucide-icon>
            </div>

            <!-- Content Card -->
            <div class="p-8 bg-slate-50 border border-slate-100 rounded-4xl transition-all hover:bg-white hover:border-emerald-100 hover:shadow-xl hover:shadow-emerald-100/20 group-hover:-translate-y-1">
               <div class="flex items-center justify-between mb-3">
                  <span class="text-[10px] uppercase font-black tracking-[0.2em] px-3 py-1 rounded-full border"
                        [ngClass]="{
                          'bg-emerald-50 text-emerald-600 border-emerald-100': event.completed,
                          'bg-slate-200/50 text-slate-500 border-slate-200': !event.completed
                        }">
                    {{event.date}}
                  </span>
                  <span *ngIf="event.completed" class="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                     <lucide-icon [name]="CheckIcon" size="10"></lucide-icon> Verified
                  </span>
               </div>
               <h3 class="text-2xl font-black text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">{{event.title}}</h3>
               <p class="text-slate-500 text-base mt-2 font-bold leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">{{event.description}}</p>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="filteredEvents().length === 0" class="flex flex-col items-center py-20 text-center">
             <div class="w-20 h-20 bg-slate-50 rounded-4xl flex items-center justify-center text-slate-200 mb-6">
                <lucide-icon [name]="SearchIcon" size="40"></lucide-icon>
             </div>
             <p class="text-slate-400 font-black uppercase tracking-widest text-xs">No timeline events correlate</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SlassTimelineComponent implements OnInit {
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);
  private readonly state = createRequestState<unknown>(null);

  readonly SearchIcon = Search;
  readonly CheckIcon = CheckCircle2;
  readonly ClockIcon = Clock;
  readonly FilterIcon = Filter;

  searchQuery = signal('');
  filterMode = signal<'all' | 'completed' | 'pending'>('all');

  events = signal<TimelineEvent[]>([]);
  loading = this.state.loading;
  error = this.state.error;

  filteredEvents = computed(() => {
    return this.events().filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(this.searchQuery().toLowerCase()) || 
                            e.description.toLowerCase().includes(this.searchQuery().toLowerCase());
      const matchesFilter = this.filterMode() === 'all' || 
                           (this.filterMode() === 'completed' && e.completed) || 
                           (this.filterMode() === 'pending' && !e.completed);
      return matchesSearch && matchesFilter;
    });
  });

  async ngOnInit(): Promise<void> {
    const response = await this.state.runObservable(this.api.tenant.tenancies(), {
      errorMessage: 'Failed to load tenancies timeline.',
    });

    if (!response) {
      this.toast.error(this.error() ?? 'Failed to load tenancies timeline.');
      return;
    }

    this.events.set(this.mapTimelineEvents(response));
  }

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
        title: `Tenancy ${id.slice(0, 8)} started`,
        date: startDate,
        description: `Lease has started and is currently marked as ${status}.`,
        completed: true,
      });
      events.push({
        title: `Scheduled tenancy end`,
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
