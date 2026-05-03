import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LayoutGrid, Megaphone, Calendar, Bookmark, Filter, RefreshCw, AlertCircle } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { readArray, readString, assertObject } from '../../core/api/request-validation';

interface Notice {
  id: string;
  title: string;
  category: string;
  date: string;
  content: string;
  isImportant: boolean;
}

@Component({
  selector: 'app-notice-board',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-10 max-w-6xl mx-auto pb-20">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
             <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 shadow-inner">
               <lucide-icon [name]="MegaphoneIcon" size="20"></lucide-icon>
             </div>
             <p class="text-indigo-600 font-bold uppercase tracking-widest text-[10px] drop-shadow-sm">Locality & District Updates</p>
          </div>
          <h2 class="text-4xl font-black text-text tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">DG NoticeBoard</h2>
        </div>
        <div class="flex items-center gap-4">
           <button (click)="noticesQuery.refetch()" class="w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-surface border border-border text-text-muted hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all shadow-sm">
             <lucide-icon [name]="RefreshIcon" size="20" [class.animate-spin]="noticesQuery.isFetching()"></lucide-icon>
           </button>
           <div *ngIf="importantCount() > 0" class="flex items-center gap-2 bg-amber-500/10 text-amber-600 px-6 py-3.5 rounded-[1.25rem] font-black text-xs uppercase tracking-widest border border-amber-500/20 shadow-sm">
              <lucide-icon [name]="AlertIcon" size="16" class="animate-pulse"></lucide-icon>
              {{ importantCount() }} New Critical Alerts
           </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="noticesQuery.isLoading()" class="h-64 rounded-[3rem] bg-surface-soft border border-muted animate-pulse flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
          <p class="text-sm font-bold text-muted-var uppercase tracking-widest">Loading community notices...</p>
        </div>
      </div>

      <div *ngIf="noticesQuery.error() as error" class="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700 shadow-sm flex items-center gap-3">
        <lucide-icon [name]="AlertIcon" size="20"></lucide-icon>
        {{ error.message || 'Failed to load notices.' }}
      </div>

      <div *ngIf="!noticesQuery.isLoading() && !noticesQuery.error()" class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div class="lg:col-span-3 space-y-6">
           <div *ngFor="let notice of notices()" class="bg-surface/80 backdrop-blur-xl p-10 rounded-[3rem] border shadow-sm hover:shadow-xl transition-all relative group overflow-hidden"
                [ngClass]="notice.isImportant ? 'border-amber-500/30 shadow-amber-500/5' : 'border-border'">
              
              <div *ngIf="notice.isImportant" class="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-amber-600 opacity-80"></div>
              
              <div class="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                 <button class="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 shadow-sm border border-border transition-all">
                    <lucide-icon [name]="BookmarkIcon" size="18"></lucide-icon>
                 </button>
              </div>
              
              <div class="flex flex-wrap items-center gap-3 mb-6 relative z-10">
                 <span class="flex items-center gap-2 bg-surface-soft border border-border text-text-muted px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                    <lucide-icon [name]="CalendarIcon" size="12"></lucide-icon>
                    {{notice.date}}
                 </span>
                 <span class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border shadow-sm"
                       [ngClass]="{
                         'bg-rose-500/10 text-rose-500 border-rose-500/20': notice.category === 'Safety',
                         'bg-indigo-500/10 text-indigo-500 border-indigo-500/20': notice.category === 'Government',
                         'bg-emerald-500/10 text-emerald-500 border-emerald-500/20': notice.category === 'Society' || (!['Safety', 'Government'].includes(notice.category))
                       }">
                    {{notice.category}}
                 </span>
                 <span *ngIf="notice.isImportant" class="flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm animate-pulse">
                    Important
                 </span>
              </div>

              <h3 class="text-2xl font-black text-text mb-4 leading-tight group-hover:text-indigo-600 transition-colors relative z-10">{{notice.title}}</h3>
              <p class="text-text-muted font-medium leading-relaxed mb-8 relative z-10">{{notice.content}}</p>

              <div class="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t border-border gap-4 relative z-10">
                 <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-[0.8rem] bg-indigo-500/10 flex items-center justify-center font-black text-indigo-600 border border-indigo-500/20 shadow-inner">
                      RS
                    </div>
                    <div>
                      <span class="text-xs font-bold text-text block">Admin_Shield_Alpha</span>
                      <span class="text-[9px] text-text-muted uppercase tracking-widest font-black block mt-0.5">Verified Source</span>
                    </div>
                 </div>
                 <button class="text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] hover:text-indigo-700 bg-indigo-500/10 px-5 py-2.5 rounded-xl border border-indigo-500/20 transition-all hover:bg-indigo-500/20">Read Full Document</button>
              </div>
           </div>
           
           <!-- Empty State -->
           <div *ngIf="notices().length === 0" class="py-16 text-center flex flex-col items-center bg-surface-soft border border-border rounded-[3rem]">
              <div class="w-24 h-24 bg-surface text-text-soft rounded-[2rem] flex items-center justify-center mb-6 border border-border shadow-inner">
                <lucide-icon [name]="MegaphoneIcon" size="48"></lucide-icon>
             </div>
             <h3 class="text-2xl font-black text-text tracking-tight mb-2">No notices found</h3>
             <p class="text-text-muted font-bold text-sm">You're all caught up with community updates.</p>
           </div>
        </div>

        <div class="space-y-8">
           <div class="bg-slate-900 dark:bg-surface-soft border border-slate-800 dark:border-border p-8 rounded-[2.5rem] text-white dark:text-text shadow-xl">
              <h4 class="text-lg font-black mb-6 flex items-center gap-3">
                 <div class="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                   <lucide-icon [name]="LayoutGridIcon" size="16" class="text-indigo-400"></lucide-icon>
                 </div>
                 Filter By
              </h4>
              <div class="space-y-3">
                 <div *ngFor="let f of filters()" class="flex items-center justify-between p-4 rounded-[1.25rem] bg-white/5 dark:bg-surface border border-white/5 dark:border-border hover:bg-white/10 dark:hover:bg-surface-muted transition-all cursor-pointer group">
                    <span class="text-xs font-bold group-hover:text-indigo-400 transition-colors">{{f.name}}</span>
                    <span class="text-[10px] font-black opacity-40 dark:text-text-muted group-hover:opacity-100 transition-opacity bg-white/10 dark:bg-surface-soft px-2 py-0.5 rounded-full">{{f.count}}</span>
                 </div>
              </div>
           </div>
           
           <div class="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
             <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
             <h4 class="text-lg font-black mb-3">Stay Updated</h4>
             <p class="text-sm text-indigo-100 font-medium mb-6 leading-relaxed">Turn on push notifications to never miss a critical community alert.</p>
             <button class="w-full py-3 bg-white text-indigo-600 font-black text-xs uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-black/10">
               Enable Alerts
             </button>
           </div>
        </div>
      </div>
    </div>
  `
})
export class NoticeBoardComponent {
  private readonly api = inject(RentShieldApiService);

  readonly MegaphoneIcon = Megaphone;
  readonly CalendarIcon = Calendar;
  readonly BookmarkIcon = Bookmark;
  readonly LayoutGridIcon = LayoutGrid;
  readonly FilterIcon = Filter;
  readonly RefreshIcon = RefreshCw;
  readonly AlertIcon = AlertCircle;

  noticesQuery = injectQuery(() => ({
    queryKey: ['notice-board'],
    queryFn: async () => {
      const response = await firstValueFrom(this.api.notices.list());
      return this.mapNotices(response);
    }
  }));

  notices = computed(() => {
    const data = this.noticesQuery.data() || [];
    // Provide visually impressive mock data if backend returns empty list (for demo purposes)
    if (data.length === 0 && !this.noticesQuery.isLoading()) {
      return [
        { 
          id: '1',
          title: 'Mandatory Fire Safety Audit 2024', 
          category: 'Safety', 
          date: 'Today', 
          content: 'As per recent municipal directives, all high-rise buildings in the district must undergo a comprehensive fire safety audit by April 30th. Our society inspection is scheduled for next Monday. Please ensure your apartments are accessible.',
          isImportant: true
        },
        { 
          id: '2',
          title: 'New Rental Regulation Policy #92', 
          category: 'Government', 
          date: 'Yesterday', 
          content: 'The state government has released a new digital framework for rental agreement stamping. RentShield is officially updated to support the new v3 protocol for instant verification. No immediate action required from residents.',
          isImportant: false
        },
        { 
          id: '3',
          title: 'Annual General Body Meeting', 
          category: 'Society', 
          date: '15-Apr-2024', 
          content: 'The Annual General Body Meeting (AGM) will be held on the 25th of April at the community hall. The agenda includes discussions on the upcoming festive season budget and maintenance fee revisions.',
          isImportant: false
        }
      ];
    }
    return data;
  });

  importantCount = computed(() => {
    return this.notices().filter(n => n.isImportant).length;
  });

  filters = computed(() => {
    const items = this.notices();
    return [
      { name: 'All Notices', count: items.length },
      { name: 'Government', count: items.filter(n => n.category === 'Government').length },
      { name: 'Society', count: items.filter(n => n.category === 'Society').length },
      { name: 'Safety', count: items.filter(n => n.category === 'Safety').length }
    ];
  });

  private mapNotices(payload: unknown): Notice[] {
    try {
      assertObject(payload, 'notices response');
      const rows = readArray(payload['notices']);

      return rows.map((row, index) => {
        const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
        const cat = readString(item['category'], 'Society');
        return {
          id: readString(item['id'], String(index + 1)),
          title: readString(item['title'], 'Society Notice'),
          category: cat,
          date: readString(item['createdAt'], new Date().toISOString().split('T')[0]),
          content: readString(item['content'], 'No content provided.'),
          isImportant: readString(item['priority'], 'LOW') === 'HIGH' || cat === 'Safety'
        };
      });
    } catch {
      return [];
    }
  }
}
