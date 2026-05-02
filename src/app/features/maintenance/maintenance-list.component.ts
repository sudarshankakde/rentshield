import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Hammer, Clock, CheckCircle } from 'lucide-angular';

@Component({
  selector: 'app-maintenance-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-8 max-w-5xl mx-auto">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-black text-slate-900 tracking-tight">Maintenance Tracker</h2>
          <p class="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">Service Requests & Health Checks</p>
        </div>
        <button class="bg-[#3a86ff] text-white px-8 py-3 rounded-2xl font-black text-lg shadow-xl shadow-blue-100 hover:scale-105 transition-transform active:scale-95">
          New Request
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div *ngFor="let r of requests" class="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
          <!-- Status Indicator -->
          <div class="absolute top-0 left-0 w-2 h-full" [ngClass]="r.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'"></div>
          
          <div class="flex items-start justify-between mb-6">
             <div class="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                <lucide-icon [name]="r.icon" size="24"></lucide-icon>
             </div>
             <span class="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 rounded-full text-slate-400">#{{r.id}}</span>
          </div>

          <h3 class="text-xl font-black text-slate-900 tracking-tight mb-2">{{r.title}}</h3>
          <p class="text-slate-500 text-sm font-medium mb-6">{{r.description}}</p>

          <div class="flex items-center justify-between pt-6 border-t border-slate-50">
             <div class="flex items-center gap-2 text-slate-400">
                <lucide-icon [name]="ClockIcon" size="14"></lucide-icon>
                <span class="text-xs font-bold">{{r.date}}</span>
             </div>
             <div class="flex items-center gap-2" [ngClass]="r.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'">
                <lucide-icon [name]="r.status === 'Completed' ? CheckIcon : ClockIcon" size="14"></lucide-icon>
                <span class="text-xs font-black uppercase tracking-widest">{{r.status}}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MaintenanceListComponent {
  readonly ClockIcon = Clock;
  readonly CheckIcon = CheckCircle;

  requests = [
    { id: 'MT-781', title: 'AC Servicing', description: 'Quarterly maintenance for Living Room AC unit.', date: 'Today, 10:00 AM', status: 'In Progress', icon: Hammer },
    { id: 'MT-625', title: 'Kitchen Sink Leak', description: 'Water seepage observed under the sink area.', date: '22-Apr-2024', status: 'Completed', icon: Hammer },
    { id: 'MT-550', title: 'Electrical Socket Fix', description: 'Sparking in Master Bedroom switchboard.', date: '15-Apr-2024', status: 'Completed', icon: Hammer }
  ];
}
