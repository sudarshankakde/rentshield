import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Users, MessageSquare, Info } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { ToastService } from '../../core/services/toast.service';
import { assertObject, readArray, readString } from '../../core/api/request-validation';
import { createRequestState } from '../../core/services/request-state.service';

@Component({
  selector: 'app-society-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-8 max-w-5xl mx-auto">
         <div *ngIf="error()" class="border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
            {{ error() }}
         </div>

         <div *ngIf="loading()" class="border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
            Loading society data...
         </div>

      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-black text-slate-900 tracking-tight">My Society</h2>
          <p class="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">{{ societyName() }}</p>
        </div>
        <div class="flex gap-4">
           <button class="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold flex items-center gap-2">
              <lucide-icon [name]="MessageIcon" size="18"></lucide-icon>
              Society Chat
           </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2 space-y-6">
           <div class="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
              <h3 class="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                 <lucide-icon [name]="InfoIcon" size="20" class="text-indigo-500"></lucide-icon>
                 Notice Board
              </h3>
              <div class="space-y-4">
                 <div *ngFor="let notice of notices()" class="p-6 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer">
                    <span class="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{{notice.date}}</span>
                    <h4 class="font-bold text-slate-900 mt-1">{{notice.title}}</h4>
                    <p class="text-sm text-slate-500 mt-2">{{notice.preview}}</p>
                 </div>
              </div>
           </div>
        </div>

        <div class="space-y-6">
           <div class="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm">
              <h3 class="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                 <lucide-icon [name]="UsersIcon" size="20" class="text-emerald-500"></lucide-icon>
                 Committee Members
              </h3>
              <div class="space-y-6">
                 <div *ngFor="let m of members()" class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400">
                       {{m.name.charAt(0)}}
                    </div>
                    <div>
                       <p class="font-black text-slate-900 text-sm">{{m.name}}</p>
                       <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{m.role}}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  `
})
export class SocietyDashboardComponent implements OnInit {
   private readonly api = inject(RentShieldApiService);
   private readonly toast = inject(ToastService);
   private readonly state = createRequestState<unknown>(null);

  readonly MessageIcon = MessageSquare;
  readonly InfoIcon = Info;
  readonly UsersIcon = Users;

   societyName = signal('Society');
   notices = signal<Array<{ title: string; date: string; preview: string }>>([]);
   members = signal<Array<{ name: string; role: string }>>([]);
   loading = this.state.loading;
   error = this.state.error;

   async ngOnInit(): Promise<void> {
      const response = await this.state.runObservable(this.api.societies.list(), {
         errorMessage: 'Failed to load societies.',
      });

      if (!response) {
         this.toast.error(this.error() ?? 'Failed to load societies.');
         return;
      }

      assertObject(response, 'societies response');
      const societies = readArray(response['societies']);
      const first = societies[0] && typeof societies[0] === 'object' ? (societies[0] as Record<string, unknown>) : null;
      const societyId = first ? readString(first['id']) : '';
      this.societyName.set(first ? readString(first['name'], 'Society') : 'Society');

      if (!societyId) {
         return;
      }

      await this.loadSocietyDetails(societyId);
      await this.loadSocietyEvents(societyId);
   }

   private async loadSocietyDetails(societyId: string): Promise<void> {
      const response = await this.state.runObservable(this.api.societies.details(societyId), {
         errorMessage: 'Failed to load society contacts.',
      });

      if (!response) {
         this.members.set([]);
         return;
      }

      assertObject(response, 'society detail response');
      const society = response['society'] && typeof response['society'] === 'object'
         ? (response['society'] as Record<string, unknown>)
         : {};

      const contacts = readArray(society['emergencyContacts']);
      this.members.set(
         contacts.map((entry) => {
            const item = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
            return {
               name: readString(item['name'], 'Committee Member'),
               role: readString(item['description'], 'Emergency Contact'),
            };
         }),
      );
   }

   private async loadSocietyEvents(societyId: string): Promise<void> {
      const response = await this.state.runObservable(this.api.societies.events(societyId), {
         errorMessage: 'Failed to load society notices.',
      });

      if (!response) {
         this.notices.set([]);
         return;
      }

      assertObject(response, 'society events response');
      const events = readArray(response['events']);
      this.notices.set(
         events.map((entry) => {
            const item = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
            return {
               title: readString(item['title'], 'Society update'),
               date: readString(item['startDate'], 'N/A'),
               preview: readString(item['description'], 'No additional details.'),
            };
         }),
      );
   }
}
