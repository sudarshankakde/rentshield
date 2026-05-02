import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleService } from '../../core/services/module.service';
import { AuthService, UserRole } from '../../core/services/auth.service';
import { LucideAngularModule, Settings, ShieldAlert, Cpu, Activity, Database, Zap } from 'lucide-angular';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-12 max-w-6xl mx-auto pb-20">
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
            <h1 class="text-5xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">System Controller</h1>
            <p class="text-slate-400 font-bold tracking-[0.3em] text-[10px] mt-2 ml-1">PLATFORM_OPERATIONS_LEVEL_ALPHA_99</p>
         </div>
         <div class="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button *ngFor="let r of roles" 
                    (click)="auth.setRole(r)"
                    class="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    [ngClass]="auth.role() === r ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'">
              {{ r }}
            </button>
         </div>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <!-- Module Management -->
        <div class="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20">
           <div class="flex items-center justify-between mb-10">
              <div class="flex items-center gap-4">
                 <div class="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <lucide-icon [name]="CpuIcon" size="24"></lucide-icon>
                 </div>
                 <div>
                    <h2 class="text-2xl font-black text-slate-900 tracking-tight">Active Core Modules</h2>
                    <p class="text-slate-400 font-bold text-xs uppercase tracking-widest">Toggle Production Features</p>
                 </div>
              </div>
              <div class="text-right">
                 <span class="text-[10px] font-black text-indigo-500 uppercase py-1 px-3 bg-indigo-50 rounded-full border border-indigo-100">Live Config</span>
              </div>
           </div>

           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div *ngFor="let m of moduleService.modules()" 
                   (click)="moduleService.toggleModule(m.id)"
                   class="flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all cursor-pointer group"
                   [ngClass]="m.isActive ? 'border-indigo-50 bg-indigo-50/20' : 'border-slate-50 bg-white opacity-60 hover:opacity-100'">
                 <div class="flex items-center gap-4">
                   <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-transform group-active:scale-95" [ngClass]="m.isActive ? m.color : 'bg-slate-200'">
                     <lucide-icon [name]="m.icon" size="20"></lucide-icon>
                   </div>
                   <div class="flex flex-col">
                      <span class="font-extrabold text-slate-900 leading-tight">{{m.name}}</span>
                      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{m.isActive ? 'Status: Active' : 'Offline'}}</span>
                   </div>
                 </div>
                 <div class="w-14 h-7 rounded-full p-1.5 transition-colors border shadow-inner" [ngClass]="m.isActive ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-100 border-slate-200'">
                    <div class="w-4 h-4 bg-white rounded-full shadow-lg transition-transform" [style.transform]="m.isActive ? 'translateX(1.75rem)' : 'none'"></div>
                 </div>
              </div>
           </div>
        </div>

        <!-- System Intelligence Side -->
        <div class="space-y-10">
           <!-- Realtime Analytics Card -->
           <div class="bg-slate-900 p-10 rounded-[3rem] text-white overflow-hidden relative shadow-2xl shadow-indigo-200">
              <div class="relative z-10">
                 <div class="flex items-center gap-2 mb-6">
                    <lucide-icon [name]="ZapIcon" class="text-amber-400 animate-pulse" size="18"></lucide-icon>
                    <h3 class="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Traffic_Engine</h3>
                 </div>
                 <p class="text-7xl font-black font-mono tracking-tighter leading-none mb-2">2.4k</p>
                 <p class="text-slate-500 font-bold text-xs uppercase tracking-widest">Active I/O Sessions</p>
                 
                 <div class="mt-12 flex items-end gap-1.5 h-16">
                    <div *ngFor="let h of [30,50,80,60,40,90,70,50,40,60,80]" 
                         class="flex-1 bg-indigo-500 rounded-full transition-all duration-1000" 
                         [style.height.%]="h"
                         [style.opacity]="h/100"></div>
                 </div>
              </div>
              <lucide-icon [name]="SettingsIcon" size="280" class="absolute -right-24 -bottom-24 text-white/[0.03]"></lucide-icon>
           </div>

           <!-- System Alerts -->
           <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/10 space-y-8">
              <div class="flex items-center gap-4">
                 <div class="w-14 h-14 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center">
                    <lucide-icon [name]="AlertIcon" size="28"></lucide-icon>
                 </div>
                 <div>
                    <h4 class="text-xl font-black text-slate-900 tracking-tight">System Integrity</h4>
                    <p class="text-rose-500 font-black text-[10px] uppercase tracking-widest mt-0.5">3 Vulnerabilities Detected</p>
                 </div>
              </div>

              <div class="space-y-4">
                 <div class="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                    <span class="text-xs font-bold text-slate-600">KYC_AUTO_REJECT_BUG</span>
                    <span class="text-[10px] font-black px-2 py-1 bg-rose-100 text-rose-600 rounded-lg">PATCH_AVAIL</span>
                 </div>
                 <div class="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                    <span class="text-xs font-bold text-slate-600">LEDGER_SYNC_DELAY</span>
                    <span class="text-[10px] font-black px-2 py-1 bg-amber-100 text-amber-600 rounded-lg">FIXING</span>
                 </div>
              </div>

              <button class="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-colors">
                 Force System Health Check
              </button>
           </div>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  moduleService = inject(ModuleService);
  auth = inject(AuthService);

  readonly CpuIcon = Cpu;
  readonly SettingsIcon = Settings;
  readonly AlertIcon = ShieldAlert;
  readonly ZapIcon = Zap;
  readonly ActivityIcon = Activity;
  readonly DatabaseIcon = Database;

  roles: UserRole[] = ['TENANT', 'LANDLORD', 'BROKER', 'EXPERT', 'SUPPORT', 'ADMIN'];

   ngOnInit(): void {
      this.moduleService.loadModulesFromBackend();
   }
}
