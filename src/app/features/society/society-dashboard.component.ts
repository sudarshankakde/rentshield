import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Users, MessageSquare, Info, Home, ShieldCheck, MapPin, Phone, Mail, Calendar, ExternalLink, RefreshCw } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { assertObject, readArray, readString } from '../../core/api/request-validation';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

interface CommitteeMember {
  name: string;
  role: string;
  avatar?: string;
}

interface SocietyNotice {
  title: string;
  date: string;
  preview: string;
}

@Component({
  selector: 'app-society-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-10 max-w-6xl mx-auto pb-20">
      
      <!-- Loading State -->
      <div *ngIf="societyQuery.isLoading()" class="h-64 rounded-[3rem] bg-surface-soft border border-muted animate-pulse flex items-center justify-center">
        <div class="flex flex-col items-center gap-4">
          <div class="w-12 h-12 rounded-full border-4 border-brand-primary border-t-transparent animate-spin"></div>
          <p class="text-sm font-bold text-muted-var uppercase tracking-widest">Gathering society data...</p>
        </div>
      </div>

      <div *ngIf="societyQuery.error() as error" class="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700 shadow-sm flex items-center gap-3">
        <lucide-icon [name]="InfoIcon" size="20"></lucide-icon>
        {{ error.message || 'Failed to load society dashboard.' }}
      </div>

      <div *ngIf="!societyQuery.isLoading() && !societyQuery.error()" class="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div class="flex items-center gap-3 mb-2">
               <div class="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner">
                 <lucide-icon [name]="HomeIcon" size="20"></lucide-icon>
               </div>
               <p class="text-brand-primary font-bold uppercase tracking-widest text-[10px] drop-shadow-sm">Building Management</p>
            </div>
            <h1 class="text-4xl font-black text-text tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">{{ societyName() }}</h1>
            <div class="flex items-center gap-3 text-text-muted text-sm font-medium mt-2">
               <lucide-icon [name]="MapIcon" size="14"></lucide-icon>
               Verified Community · Gurgaon Sec-45
            </div>
          </div>
          
          <div class="flex items-center gap-3">
             <button (click)="societyQuery.refetch()" class="w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-surface border border-border text-text-muted hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all shadow-sm">
               <lucide-icon [name]="RefreshIcon" size="20" [class.animate-spin]="societyQuery.isFetching()"></lucide-icon>
             </button>
             <button class="bg-slate-900 dark:bg-brand-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-black/10 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-2">
                <lucide-icon [name]="MessageIcon" size="18"></lucide-icon>
                Society Chat
             </button>
          </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          <div class="space-y-8">
             <!-- Notice Board Card -->
             <div class="bg-surface/80 backdrop-blur-xl p-10 rounded-[3rem] border border-border shadow-sm overflow-hidden relative group">
                <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
                
                <div class="flex items-center justify-between mb-8 relative z-10">
                  <h3 class="text-2xl font-black text-text tracking-tight flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 shadow-inner">
                      <lucide-icon [name]="InfoIcon" size="20"></lucide-icon>
                    </div>
                    Community Announcements
                  </h3>
                  <button class="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline flex items-center gap-1.5">
                    View All <lucide-icon [name]="ExternalLinkIcon" size="12"></lucide-icon>
                  </button>
                </div>

                <div class="space-y-4 relative z-10">
                   <div *ngFor="let notice of notices()" class="p-6 bg-surface-soft border border-border/50 rounded-[2rem] hover:bg-surface hover:border-indigo-500/30 transition-all cursor-pointer group/item hover:shadow-lg hover:-translate-y-1">
                      <div class="flex items-center gap-3 mb-2">
                        <span class="text-[9px] font-black uppercase text-indigo-500 tracking-[0.2em] px-2.5 py-1 bg-indigo-500/5 rounded-full border border-indigo-500/10">{{notice.date}}</span>
                        <div class="w-1 h-1 rounded-full bg-border"></div>
                        <span class="text-[9px] font-black uppercase text-text-soft tracking-widest">Admin Team</span>
                      </div>
                      <h4 class="text-lg font-black text-text group-hover/item:text-indigo-600 transition-colors">{{notice.title}}</h4>
                      <p class="text-sm text-text-muted font-medium mt-2 leading-relaxed">{{notice.preview}}</p>
                   </div>

                   <!-- Empty State -->
                   <div *ngIf="notices().length === 0" class="py-12 text-center">
                     <div class="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border shadow-inner opacity-40">
                        <lucide-icon [name]="InfoIcon" size="32"></lucide-icon>
                     </div>
                     <p class="text-sm font-black text-text-muted uppercase tracking-widest">No recent notices</p>
                   </div>
                </div>
             </div>

             <!-- Quick Actions / Stats -->
             <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-emerald-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                   <div class="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                   <h4 class="text-lg font-black mb-2 flex items-center gap-2">
                      <lucide-icon [name]="ShieldCheckIcon" size="20"></lucide-icon>
                      Safety Rating
                   </h4>
                   <p class="text-emerald-100 text-sm font-medium mb-6">Secured locality with 24/7 surveillance and verified access controls.</p>
                   <div class="flex items-end justify-between">
                      <span class="text-4xl font-black tracking-tighter">9.2<span class="text-xl text-emerald-200">/10</span></span>
                      <button class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors backdrop-blur-sm">Details</button>
                   </div>
                </div>
                
                <div class="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                   <div class="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                   <h4 class="text-lg font-black mb-2 flex items-center gap-2">
                      <lucide-icon [name]="MessageIcon" size="20"></lucide-icon>
                      Connectivity
                   </h4>
                   <p class="text-indigo-100 text-sm font-medium mb-6">Active resident community with high engagement and instant support.</p>
                   <div class="flex items-end justify-between">
                      <span class="text-4xl font-black tracking-tighter">480+<span class="text-xl text-indigo-200 ml-1">Members</span></span>
                      <button class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors backdrop-blur-sm">Join</button>
                   </div>
                </div>
             </div>
          </div>

          <aside class="space-y-8">
             <!-- Committee Card -->
             <div class="bg-surface border border-border p-8 rounded-[3rem] shadow-sm">
                <h3 class="text-xl font-black text-text mb-8 flex items-center gap-3">
                   <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-inner">
                     <lucide-icon [name]="UsersIcon" size="20"></lucide-icon>
                   </div>
                   Committee
                </h3>
                <div class="space-y-6">
                   <div *ngFor="let m of members()" class="flex items-center gap-4 group/member">
                      <div class="w-14 h-14 rounded-2xl bg-surface-soft border border-border flex items-center justify-center font-black text-text-soft text-lg group-hover/member:scale-110 group-hover/member:bg-brand-primary/10 group-hover/member:text-brand-primary transition-all duration-300 overflow-hidden shadow-sm">
                         {{m.name.charAt(0)}}
                      </div>
                      <div class="min-w-0">
                         <p class="font-black text-text text-sm truncate group-hover/member:text-brand-primary transition-colors">{{m.name}}</p>
                         <p class="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] mt-0.5">{{m.role}}</p>
                      </div>
                   </div>

                   <!-- Empty State -->
                   <div *ngIf="members().length === 0" class="py-8 text-center text-text-soft text-sm font-bold opacity-40 italic">
                      Contacts coming soon...
                   </div>
                </div>
                
                <div class="mt-10 pt-8 border-t border-border flex flex-col gap-3">
                   <button class="w-full py-4 rounded-2xl bg-surface-soft border border-border text-text-muted hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                     <lucide-icon [name]="PhoneIcon" size="14"></lucide-icon>
                     Emergency Contacts
                   </button>
                   <button class="w-full py-4 rounded-2xl bg-surface-soft border border-border text-text-muted hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                     <lucide-icon [name]="MailIcon" size="14"></lucide-icon>
                     Email Board
                   </button>
                </div>
             </div>
             
             <!-- Calendar Helper -->
             <div class="bg-surface p-8 rounded-[3rem] border border-border shadow-inner relative overflow-hidden">
                <div class="absolute -top-12 -left-12 w-32 h-32 bg-brand-primary/5 rounded-full blur-2xl"></div>
                <h4 class="text-sm font-black uppercase tracking-[0.2em] text-text-soft mb-6 flex items-center gap-2">
                   <lucide-icon [name]="CalendarIcon" size="14"></lucide-icon>
                   Upcoming
                </h4>
                <div class="space-y-4">
                   <div class="flex gap-4">
                      <div class="w-12 h-12 bg-white dark:bg-surface-muted rounded-2xl border border-border flex flex-col items-center justify-center shadow-sm shrink-0">
                         <span class="text-[9px] font-black uppercase text-rose-500 leading-none mb-1">MAY</span>
                         <span class="text-lg font-black text-text leading-none">12</span>
                      </div>
                      <div>
                         <p class="text-xs font-black text-text">Town Hall Meeting</p>
                         <p class="text-[10px] font-medium text-text-muted mt-1">Community Center · 7 PM</p>
                      </div>
                   </div>
                </div>
             </div>
          </aside>
        </div>
      </div>
    </div>
  `
})
export class SocietyDashboardComponent {
  private readonly api = inject(RentShieldApiService);

  readonly HomeIcon = Home;
  readonly MessageIcon = MessageSquare;
  readonly InfoIcon = Info;
  readonly UsersIcon = Users;
  readonly ShieldCheckIcon = ShieldCheck;
  readonly MapIcon = MapPin;
  readonly PhoneIcon = Phone;
  readonly MailIcon = Mail;
  readonly CalendarIcon = Calendar;
  readonly ExternalLinkIcon = ExternalLink;
  readonly RefreshIcon = RefreshCw;

  societyQuery = injectQuery(() => ({
    queryKey: ['society-dashboard-full'],
    queryFn: async () => {
      // 1. Fetch society list to find the first one
      const listRes = await firstValueFrom(this.api.societies.list());
      assertObject(listRes, 'societies list response');
      const societies = readArray(listRes['societies']);
      const first = societies[0] && typeof societies[0] === 'object' ? (societies[0] as Record<string, unknown>) : null;
      const societyId = first ? readString(first['id']) : '';
      const societyName = first ? readString(first['name'], 'Your Community') : 'Your Community';

      if (!societyId) {
        return { societyName, members: [], notices: [] };
      }

      // 2. Fetch details and events
      const [detailsRes, eventsRes] = await Promise.all([
        firstValueFrom(this.api.societies.details(societyId)),
        firstValueFrom(this.api.societies.events(societyId))
      ]);

      // Map Details (Contacts)
      assertObject(detailsRes, 'society details response');
      const detailData = detailsRes['society'] && typeof detailsRes['society'] === 'object' 
        ? (detailsRes['society'] as Record<string, unknown>) 
        : {};
      const contacts = readArray(detailData['emergencyContacts']);
      const members: CommitteeMember[] = contacts.map(c => {
        const item = c && typeof c === 'object' ? (c as Record<string, unknown>) : {};
        return {
          name: readString(item['name'], 'Committee Member'),
          role: readString(item['description'], 'Representative')
        };
      });

      // Map Events (Notices)
      assertObject(eventsRes, 'society events response');
      const events = readArray(eventsRes['events']);
      const notices: SocietyNotice[] = events.map(e => {
        const item = e && typeof e === 'object' ? (e as Record<string, unknown>) : {};
        return {
          title: readString(item['title'], 'Update'),
          date: readString(item['startDate'], 'N/A'),
          preview: readString(item['description'], 'Click to read more details about this society update.')
        };
      });

      return { societyName, members, notices };
    }
  }));

  societyName = computed(() => this.societyQuery.data()?.societyName || 'Your Society');
  members = computed(() => this.societyQuery.data()?.members || []);
  notices = computed(() => {
    const data = this.societyQuery.data()?.notices || [];
    // Demo fallback if empty
    if (data.length === 0 && !this.societyQuery.isLoading()) {
      return [
        { title: 'Elevator Maintenance Scheduled', date: '12-May-2024', preview: 'Routine maintenance of Block A elevators will take place between 10 AM and 4 PM. Please use Block B elevators.' },
        { title: 'Summer Pool Timings', date: '08-May-2024', preview: 'Swimming pool timings have been extended for the summer season. New hours: 6 AM to 10 PM daily.' }
      ];
    }
    return data;
  });
}
