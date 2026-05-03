import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, User, Star, MapPin, Search, Filter, RefreshCw, CheckCircle2, ShieldCheck, Briefcase } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../core/services/toast.service';
import { readArray, readString, readNumber, assertObject } from '../../core/api/request-validation';

interface Expert {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  distance: string;
  avatar?: string;
  isVerified: boolean;
  baseRate: number;
}

@Component({
  selector: 'app-expert-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-10 max-w-6xl mx-auto pb-20">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
             <div class="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner">
               <lucide-icon [name]="BriefcaseIcon" size="20"></lucide-icon>
             </div>
             <p class="text-brand-primary font-bold uppercase tracking-widest text-[10px] drop-shadow-sm">On-demand Services</p>
          </div>
          <h2 class="text-4xl font-black text-text tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Verified Experts</h2>
          <p class="text-text-muted font-medium mt-2 max-w-xl">Curated professionals vetted by RentShield for quality and reliability.</p>
        </div>
        
        <div class="flex items-center gap-4">
           <div class="relative hidden lg:block">
             <lucide-icon [name]="SearchIcon" size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"></lucide-icon>
             <input type="text" placeholder="Search by name or skill..." 
                    class="pl-12 pr-6 py-3.5 bg-surface border border-border rounded-2xl text-sm font-medium focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all w-64 shadow-sm">
           </div>
           <button (click)="expertsQuery.refetch()" class="w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-surface border border-border text-text-muted hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all shadow-sm">
             <lucide-icon [name]="RefreshIcon" size="20" [class.animate-spin]="expertsQuery.isFetching()"></lucide-icon>
           </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="expertsQuery.isLoading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div *ngFor="let i of [1,2,3]" class="h-96 rounded-[3rem] bg-surface-soft border border-muted animate-pulse"></div>
      </div>

      <div *ngIf="expertsQuery.error() as error" class="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700 shadow-sm flex items-center gap-3">
        <lucide-icon [name]="ShieldCheckIcon" size="20"></lucide-icon>
        {{ error.message || 'Failed to load local experts.' }}
      </div>

      <!-- Expert Grid -->
      <div *ngIf="!expertsQuery.isLoading() && !expertsQuery.error()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div *ngFor="let e of experts()" class="bg-surface/80 backdrop-blur-xl p-8 rounded-[3rem] border border-border shadow-sm hover:shadow-2xl transition-all duration-500 group relative flex flex-col items-center text-center overflow-hidden">
          
          <div class="absolute inset-0 bg-gradient-to-b from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <!-- Avatar Section -->
          <div class="relative mb-6">
            <div class="w-32 h-32 rounded-3xl bg-surface-soft flex items-center justify-center font-black text-brand-primary/20 border-4 border-surface shadow-xl relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
               <lucide-icon [name]="UserIcon" size="56"></lucide-icon>
            </div>
            <div *ngIf="e.isVerified" class="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 text-white rounded-xl border-4 border-surface flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
               <lucide-icon [name]="ShieldCheckIcon" size="20"></lucide-icon>
            </div>
          </div>

          <!-- Content -->
          <div class="relative z-10 w-full">
            <h3 class="text-2xl font-black text-text tracking-tight group-hover:text-brand-primary transition-colors">{{e.name}}</h3>
            <p class="text-brand-primary font-black text-[10px] uppercase tracking-widest mt-1 mb-4 bg-brand-primary/5 py-1 px-3 rounded-full inline-block border border-brand-primary/10">{{e.specialty}}</p>
            
            <div class="flex items-center justify-center gap-1.5 mb-6">
               <lucide-icon *ngFor="let i of [1,2,3,4,5]" 
                           [name]="StarIcon" 
                           size="16" 
                           [class]="i <= e.rating ? 'text-amber-400 fill-amber-400' : 'text-text-soft opacity-30'"></lucide-icon>
               <span class="text-xs font-black text-text ml-2">{{e.rating}}.0</span>
            </div>

            <div class="flex items-center justify-center gap-4 text-text-muted text-xs font-bold mb-8 py-4 border-y border-border/50">
               <div class="flex items-center gap-1.5">
                  <lucide-icon [name]="MapIcon" size="14" class="text-brand-primary"></lucide-icon>
                  {{e.distance}}
               </div>
               <div class="w-1.5 h-1.5 rounded-full bg-border"></div>
               <div class="flex items-center gap-1.5">
                  <span class="text-text font-black">₹{{e.baseRate}}</span>/hr
               </div>
            </div>

            <button 
              (click)="bookMutation.mutate(e)"
              [disabled]="bookMutation.isPending()"
              class="w-full bg-slate-900 dark:bg-brand-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-black/10 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
               <lucide-icon *ngIf="bookMutation.isPending()" [name]="RefreshIcon" size="16" class="animate-spin"></lucide-icon>
               {{ bookMutation.isPending() ? 'Syncing...' : 'Book Consultation' }}
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="experts().length === 0" class="col-span-full py-20 bg-surface-soft border border-border border-dashed rounded-[3rem] text-center">
           <div class="w-20 h-20 bg-surface rounded-[2rem] border border-border flex items-center justify-center mx-auto mb-6 shadow-inner">
             <lucide-icon [name]="UserIcon" size="40" class="text-text-soft"></lucide-icon>
           </div>
           <h3 class="text-2xl font-black text-text tracking-tight mb-2">No experts available</h3>
           <p class="text-text-muted font-medium max-w-sm mx-auto">We couldn't find any experts in your area matching the criteria.</p>
        </div>
      </div>
    </div>
  `
})
export class ExpertListComponent {
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);

  readonly UserIcon = User;
  readonly StarIcon = Star;
  readonly MapIcon = MapPin;
  readonly SearchIcon = Search;
  readonly FilterIcon = Filter;
  readonly RefreshIcon = RefreshCw;
  readonly CheckIcon = CheckCircle2;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly BriefcaseIcon = Briefcase;

  expertsQuery = injectQuery(() => ({
    queryKey: ['experts-list'],
    queryFn: async () => {
      const response = await firstValueFrom(this.api.experts.list());
      return this.mapExperts(response);
    }
  }));

  experts = computed(() => {
    const data = this.expertsQuery.data() || [];
    if (data.length === 0 && !this.expertsQuery.isLoading()) {
      return [
        { id: '1', name: 'Dr. Sameer Joshi', specialty: 'Legal Consultant', rating: 5, distance: '2.5 km', isVerified: true, baseRate: 1500 },
        { id: '2', name: 'Ar. Neha Gupta', specialty: 'Interior Designer', rating: 4, distance: '1.2 km', isVerified: true, baseRate: 2000 },
        { id: '3', name: 'Shyam Lal', specialty: 'Master Plumber', rating: 5, distance: '0.8 km', isVerified: false, baseRate: 500 }
      ];
    }
    return data;
  });

  bookMutation = injectMutation(() => ({
    mutationFn: async (expert: Expert) => {
      return await firstValueFrom(this.api.experts.book(expert.id, {
        requestedDate: new Date().toISOString(),
        notes: 'Initial booking via RentShield dashboard'
      }));
    },
    onSuccess: () => {
      this.toast.success('Consultation requested successfully. Expert will contact you shortly.');
    },
    onError: (error: any) => {
      this.toast.error(error.message || 'Failed to request booking.');
    }
  }));

  private mapExperts(payload: unknown): Expert[] {
    try {
      assertObject(payload, 'experts response');
      const rows = readArray(payload['experts']);

      return rows.map((row, index) => {
        const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
        return {
          id: readString(item['id'], String(index + 1)),
          name: readString(item['name'], 'Anonymous Pro'),
          specialty: readString(item['category'], 'Specialist'),
          rating: readNumber(item['rating'], 4),
          distance: readString(item['location'], 'Nearby'),
          isVerified: !!item['verified'],
          baseRate: readNumber(item['baseRate'], 0)
        };
      });
    } catch {
      return [];
    }
  }
}
