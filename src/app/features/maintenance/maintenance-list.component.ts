import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Hammer, Clock, CheckCircle, Plus, Wrench, Filter } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { readArray, readString } from '../../core/api/request-validation';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'In Progress' | 'Completed' | 'Pending';
  priority: 'High' | 'Medium' | 'Low';
}

@Component({
  selector: 'app-maintenance-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-8 max-w-6xl mx-auto pb-20">
      
      <!-- Loading State -->
      <div *ngIf="maintenanceQuery.isLoading()" class="h-64 rounded-[3rem] bg-surface-soft border border-muted animate-pulse flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin"></div>
          <p class="text-sm font-bold text-muted-var uppercase tracking-widest">Loading maintenance requests...</p>
        </div>
      </div>

      <div *ngIf="maintenanceQuery.error() as error" class="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700 shadow-sm flex items-center gap-3">
        <lucide-icon [name]="FilterIcon" size="20"></lucide-icon>
        {{ error.message || 'Failed to load maintenance requests.' }}
      </div>

      <div *ngIf="!maintenanceQuery.isLoading() && !maintenanceQuery.error()" class="bg-surface/80 backdrop-blur-xl p-8 lg:p-12 rounded-[3rem] border border-border shadow-xl relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 class="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Maintenance Tracker</h2>
            <p class="text-brand font-bold uppercase tracking-widest text-[10px] mt-2 drop-shadow-sm">Service Requests & Health Checks</p>
          </div>
          <button class="group relative overflow-hidden bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all hover:-translate-y-1 hover:shadow-brand/30 flex items-center gap-2">
             <span class="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -translate-x-full"></span>
             <span class="relative z-10 flex items-center gap-2">
               <lucide-icon [name]="PlusIcon" size="16"></lucide-icon>
               New Request
             </span>
          </button>
        </div>

        <div class="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let r of filteredRequests()" class="p-8 bg-surface-soft border border-border rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-primary/30 transition-all duration-300 relative overflow-hidden group flex flex-col">
            
            <!-- Status Gradient Bar -->
            <div class="absolute top-0 left-0 w-full h-1.5 opacity-80" 
                 [ngClass]="{
                   'bg-gradient-to-r from-emerald-400 to-emerald-600': r.status === 'Completed',
                   'bg-gradient-to-r from-amber-400 to-amber-600': r.status === 'In Progress',
                   'bg-gradient-to-r from-slate-400 to-slate-600': r.status === 'Pending'
                 }"></div>
            
            <div class="flex items-start justify-between mb-6 flex-1">
               <div class="w-14 h-14 rounded-[1.25rem] bg-surface flex items-center justify-center text-text-muted border border-border group-hover:bg-brand-primary/10 group-hover:text-brand-primary group-hover:border-brand-primary/20 transition-all duration-300 group-hover:rotate-3 group-hover:scale-110 shadow-sm">
                  <lucide-icon [name]="WrenchIcon" size="24"></lucide-icon>
               </div>
               <span class="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-surface border border-border rounded-full text-text-muted shadow-sm">#{{r.id.slice(0,6)}}</span>
            </div>

            <div class="flex items-center gap-2 mb-2">
              <span class="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded border"
                    [ngClass]="{
                      'bg-rose-500/10 text-rose-500 border-rose-500/20': r.priority === 'High',
                      'bg-amber-500/10 text-amber-600 border-amber-500/20': r.priority === 'Medium',
                      'bg-blue-500/10 text-blue-500 border-blue-500/20': r.priority === 'Low'
                    }">
                {{ r.priority }} Priority
              </span>
            </div>

            <h3 class="text-xl font-black text-text tracking-tight mb-2 group-hover:text-brand-primary transition-colors line-clamp-1">{{r.title}}</h3>
            <p class="text-text-muted text-sm font-medium mb-8 flex-1 line-clamp-2 leading-relaxed">{{r.description}}</p>

            <div class="flex items-center justify-between pt-5 border-t border-border">
               <div class="flex items-center gap-2 text-text-muted">
                  <lucide-icon [name]="ClockIcon" size="14"></lucide-icon>
                  <span class="text-xs font-bold">{{r.date}}</span>
               </div>
               <div class="flex items-center gap-1.5" 
                    [ngClass]="{
                      'text-emerald-500': r.status === 'Completed',
                      'text-amber-500': r.status === 'In Progress',
                      'text-slate-500': r.status === 'Pending'
                    }">
                  <lucide-icon [name]="r.status === 'Completed' ? CheckIcon : ClockIcon" size="14"></lucide-icon>
                  <span class="text-[10px] font-black uppercase tracking-widest">{{r.status}}</span>
               </div>
            </div>
          </div>
          
          <!-- Empty State -->
          <div *ngIf="filteredRequests().length === 0" class="col-span-full py-20 text-center flex flex-col items-center">
             <div class="w-24 h-24 bg-surface-soft text-text-soft rounded-[2rem] flex items-center justify-center mb-6 border border-border shadow-inner">
               <lucide-icon [name]="HammerIcon" size="48"></lucide-icon>
            </div>
            <h3 class="text-2xl font-black text-text tracking-tight mb-2">No maintenance requests</h3>
            <p class="text-text-muted font-bold text-sm">Everything is running smoothly!</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MaintenanceListComponent {
  private readonly api = inject(RentShieldApiService);

  readonly ClockIcon = Clock;
  readonly CheckIcon = CheckCircle;
  readonly PlusIcon = Plus;
  readonly HammerIcon = Hammer;
  readonly WrenchIcon = Wrench;
  readonly FilterIcon = Filter;

  maintenanceQuery = injectQuery(() => ({
    queryKey: ['maintenance-requests'],
    queryFn: async () => {
      const response = await firstValueFrom(this.api.maintenance.tenantRequests());
      return this.mapRequests(response);
    }
  }));

  filteredRequests = computed(() => {
    const requests = this.maintenanceQuery.data() || [];
    // Currently no filters but computed is ready for it.
    return requests;
  });

  private mapRequests(payload: unknown): MaintenanceRequest[] {
    const arr = Array.isArray(payload) ? payload : ((payload && typeof payload === 'object' && (payload as any).requests) ? (payload as any).requests : []);
    const parsed = readArray(arr);
    
    const requests = parsed.map(item => {
      const row = typeof item === 'object' && item ? (item as Record<string, unknown>) : {};
      return {
        id: readString(row['id'], 'REQ-' + Math.floor(Math.random() * 10000)),
        title: readString(row['title'], 'Maintenance Task'),
        description: readString(row['description'], 'No details provided.'),
        date: readString(row['createdAt'], new Date().toISOString().split('T')[0]),
        status: this.parseStatus(readString(row['status'], 'Pending')),
        priority: this.parsePriority(readString(row['priority'], 'Medium')),
      };
    });

    // Provide mock fallback if none exist (to show the UI design)
    if (requests.length === 0) {
      return [
        { id: 'REQ-781', title: 'AC Servicing', description: 'Quarterly maintenance for Living Room AC unit.', date: 'Today, 10:00 AM', status: 'In Progress', priority: 'High' },
        { id: 'REQ-625', title: 'Kitchen Sink Leak', description: 'Water seepage observed under the sink area.', date: '22-Apr-2024', status: 'Completed', priority: 'Medium' },
        { id: 'REQ-550', title: 'Electrical Socket Fix', description: 'Sparking in Master Bedroom switchboard.', date: '15-Apr-2024', status: 'Completed', priority: 'High' }
      ];
    }
    return requests;
  }

  private parseStatus(status: string): MaintenanceRequest['status'] {
    if (status.toUpperCase() === 'COMPLETED') return 'Completed';
    if (status.toUpperCase() === 'IN_PROGRESS' || status.toUpperCase() === 'IN PROGRESS') return 'In Progress';
    return 'Pending';
  }

  private parsePriority(priority: string): MaintenanceRequest['priority'] {
    if (priority.toUpperCase() === 'HIGH') return 'High';
    if (priority.toUpperCase() === 'LOW') return 'Low';
    return 'Medium';
  }
}
