import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LayoutGrid, Megaphone, Calendar, Bookmark } from 'lucide-angular';

@Component({
  selector: 'app-notice-board',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-10 max-w-6xl mx-auto pb-20">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 class="text-4xl font-black text-slate-900 tracking-tight">DG NoticeBoard</h2>
          <p class="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Locality & District Updates</p>
        </div>
        <div class="flex items-center gap-2 bg-amber-50 text-amber-600 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest border border-amber-100">
           <lucide-icon [name]="MegaphoneIcon" size="16" class="animate-bounce"></lucide-icon>
           5 New Critical Alerts
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div class="lg:col-span-3 space-y-6">
           <div *ngFor="let notice of notices" class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all relative group">
              <div class="absolute top-10 right-10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button class="p-3 text-slate-300 hover:text-indigo-600">
                    <lucide-icon [name]="BookmarkIcon" size="20"></lucide-icon>
                 </button>
              </div>
              
              <div class="flex items-center gap-4 mb-6 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                 <span class="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full">
                    <lucide-icon [name]="CalendarIcon" size="12"></lucide-icon>
                    {{notice.date}}
                 </span>
                 <span class="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                    {{notice.category}}
                 </span>
              </div>

              <h3 class="text-2xl font-black text-slate-900 mb-4">{{notice.title}}</h3>
              <p class="text-slate-500 font-medium leading-relaxed mb-8">{{notice.content}}</p>

              <div class="flex items-center justify-between">
                 <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">RS</div>
                    <span class="text-xs font-bold text-slate-600">Admin_Shield_Alpha</span>
                 </div>
                 <button class="text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] hover:underline">Read Full Document</button>
              </div>
           </div>
        </div>

        <div class="space-y-8">
           <div class="bg-slate-900 p-8 rounded-[2.5rem] text-white">
              <h4 class="text-lg font-black mb-6 flex items-center gap-2">
                 <lucide-icon [name]="LayoutGridIcon" size="20" class="text-indigo-400"></lucide-icon>
                 Filter By
              </h4>
              <div class="space-y-3">
                 <div *ngFor="let f of filters" class="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <span class="text-xs font-bold">{{f.name}}</span>
                    <span class="text-[10px] font-black opacity-40">{{f.count}}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  `
})
export class NoticeBoardComponent {
  readonly MegaphoneIcon = Megaphone;
  readonly CalendarIcon = Calendar;
  readonly BookmarkIcon = Bookmark;
  readonly LayoutGridIcon = LayoutGrid;

  filters = [
    { name: 'All Notices', count: 24 },
    { name: 'Government', count: 6 },
    { name: 'Society', count: 12 },
    { name: 'Safety', count: 4 }
  ];

  notices = [
    { 
      title: 'Mandatory Fire Safety Audit 2024', 
      category: 'Safety', 
      date: '24-Apr-2024', 
      content: 'As per recent municipal directives, all high-rise buildings in the district must undergo a comprehensive fire safety audit by April 30th. Our society inspection is scheduled for next Monday.' 
    },
    { 
      title: 'New Rental Regulation Policy #92', 
      category: 'Government', 
      date: '20-Apr-2024', 
      content: 'The state government has released a new digital framework for rental agreement stamping. RentShield is officially updated to support the new v3 protocol for instant verification.' 
    }
  ];
}
