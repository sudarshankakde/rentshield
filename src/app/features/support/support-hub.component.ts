import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, HelpCircle, Phone, Mail, Search, ChevronRight, MessageSquare, ShieldQuestion, LifeBuoy, RefreshCw } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { assertObject, readArray, readString } from '../../core/api/request-validation';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

interface FAQ {
  q: string;
  a: string;
}

@Component({
  selector: 'app-support-hub',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-16 max-w-6xl mx-auto pb-20">
      
      <!-- Hero Section -->
      <section class="text-center relative">
        <div class="absolute inset-0 -top-24 bg-gradient-to-b from-brand-primary/5 to-transparent rounded-full blur-3xl h-64 w-full opacity-50"></div>
        <div class="relative z-10">
          <div class="flex items-center justify-center gap-3 mb-6">
             <div class="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner">
               <lucide-icon [name]="LifeBuoyIcon" size="24"></lucide-icon>
             </div>
             <span class="text-brand-primary font-black uppercase tracking-[0.3em] text-[10px]">RentShield Support Hub</span>
          </div>
          <h1 class="text-5xl font-black text-text tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 mb-6">How can we assist you?</h1>
          
          <div class="max-w-2xl mx-auto relative group">
             <lucide-icon [name]="SearchIcon" size="20" class="absolute left-6 top-1/2 -translate-y-1/2 text-text-soft group-focus-within:text-brand-primary transition-colors"></lucide-icon>
             <input type="text" placeholder="Search for answers about agreements, maintenance, or KYC..." 
                    class="w-full pl-16 pr-8 py-5 bg-surface/80 backdrop-blur-xl border border-border rounded-3xl text-lg font-medium focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all shadow-xl shadow-brand-primary/5">
          </div>
        </div>
      </section>

      <!-- Contact Channels -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        <div class="p-8 bg-surface border border-border rounded-[3rem] shadow-sm text-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group">
           <div class="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-3xl flex items-center justify-center mx-auto mb-6 border border-brand-primary/20 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <lucide-icon [name]="ChatIcon" size="32"></lucide-icon>
           </div>
           <h3 class="text-xl font-black text-text mb-2">Live Concierge</h3>
           <p class="text-sm text-text-muted mb-8 font-medium">Instant help for active tenancies</p>
           <button class="w-full bg-slate-900 dark:bg-brand-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all hover:brightness-110 active:scale-95">Start Chat</button>
        </div>

        <div class="p-8 bg-surface border border-border rounded-[3rem] shadow-sm text-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group">
           <div class="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-inner group-hover:scale-110 group-hover:-rotate-6 transition-transform">
              <lucide-icon [name]="PhoneIcon" size="32"></lucide-icon>
           </div>
           <h3 class="text-xl font-black text-text mb-2">Voice Support</h3>
           <p class="text-sm text-text-muted mb-8 font-medium">Priority assistance 24/7</p>
           <button class="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all hover:brightness-110 active:scale-95">+1800-RS-HELP</button>
        </div>

        <div class="p-8 bg-surface border border-border rounded-[3rem] shadow-sm text-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group">
           <div class="w-16 h-16 bg-indigo-500/10 text-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform">
              <lucide-icon [name]="MailIcon" size="32"></lucide-icon>
           </div>
           <h3 class="text-xl font-black text-text mb-2">Email Desk</h3>
           <p class="text-sm text-text-muted mb-8 font-medium">Ticketing & documentation help</p>
           <button class="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all hover:brightness-110 active:scale-95">Open Ticket</button>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="bg-surface/80 backdrop-blur-xl p-10 lg:p-14 rounded-[4rem] border border-border shadow-xl relative overflow-hidden">
        <div class="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="flex items-center justify-between mb-12 relative z-10">
          <h3 class="text-3xl font-black text-text tracking-tight flex items-center gap-4">
             <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-inner">
               <lucide-icon [name]="ShieldQuestionIcon" size="28"></lucide-icon>
             </div>
             Knowledge Base
          </h3>
          <button (click)="supportQuery.refetch()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-text-muted hover:text-brand-primary hover:border-brand-primary transition-all">
            <lucide-icon [name]="RefreshIcon" size="18" [class.animate-spin]="supportQuery.isFetching()"></lucide-icon>
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="supportQuery.isLoading()" class="space-y-6">
          <div *ngFor="let i of [1,2,3]" class="h-24 bg-surface-soft border border-muted rounded-[2rem] animate-pulse"></div>
        </div>

        <div *ngIf="supportQuery.error() as error" class="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700 shadow-sm flex items-center gap-3">
          <lucide-icon [name]="ShieldQuestionIcon" size="20"></lucide-icon>
          {{ error.message || 'Failed to load help articles.' }}
        </div>

        <div *ngIf="!supportQuery.isLoading() && !supportQuery.error()" class="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 relative z-10">
           <div *ngFor="let faq of faqs()" class="group p-8 rounded-[2.5rem] bg-surface-soft hover:bg-white dark:hover:bg-surface-muted border border-border/50 hover:border-brand-primary/30 transition-all cursor-pointer hover:shadow-xl hover:-translate-y-1">
              <div class="flex items-start justify-between gap-4 mb-4">
                 <h4 class="font-black text-text text-xl leading-tight group-hover:text-brand-primary transition-colors">{{faq.q}}</h4>
                 <div class="w-8 h-8 rounded-full bg-border/20 flex items-center justify-center shrink-0 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                    <lucide-icon [name]="ChevronRightIcon" size="16"></lucide-icon>
                 </div>
              </div>
              <p class="text-text-muted font-medium leading-relaxed line-clamp-3 text-sm">{{faq.a}}</p>
           </div>
           
           <!-- Empty State -->
           <div *ngIf="faqs().length === 0" class="col-span-full py-12 text-center text-text-soft font-bold opacity-40">
             No help articles found at the moment.
           </div>
        </div>

        <div class="mt-16 text-center relative z-10">
           <p class="text-text-muted font-bold text-sm mb-6">Didn't find what you were looking for?</p>
           <button class="bg-surface border-2 border-brand-primary text-brand-primary px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-lg shadow-brand-primary/10">Browse Full Documentation</button>
        </div>
      </div>
    </div>
  `
})
export class SupportHubComponent {
  private readonly api = inject(RentShieldApiService);

  readonly ChatIcon = MessageSquare;
  readonly PhoneIcon = Phone;
  readonly MailIcon = Mail;
  readonly HelpIcon = HelpCircle;
  readonly SearchIcon = Search;
  readonly ChevronRightIcon = ChevronRight;
  readonly ShieldQuestionIcon = ShieldQuestion;
  readonly LifeBuoyIcon = LifeBuoy;
  readonly RefreshIcon = RefreshCw;

  supportQuery = injectQuery(() => ({
    queryKey: ['support-kb-search'],
    queryFn: async () => {
      const response = await firstValueFrom(this.api.support.searchKb());
      return this.mapFaqs(response);
    }
  }));

  faqs = computed(() => {
    const data = this.supportQuery.data() || [];
    // Demo fallback if empty
    if (data.length === 0 && !this.supportQuery.isLoading()) {
      return [
        { q: 'How do I renew my digital agreement?', a: 'You can initiate a renewal 30 days before expiry from the Agreements tab. Both parties will need to e-sign the new version via Aadhar e-KYC.' },
        { q: 'When is my security deposit refunded?', a: 'Upon successful move-out inspection and closure of the exit workflow, the deposit is settled within 7 business days after deducting any verified dues.' },
        { q: 'What is a verified maintenance request?', a: 'Requests raised via RentShield are tagged with photos and timestamps, allowing for transparent tracking and automated billing adjustments.' },
        { q: 'Is my data secure with RentShield?', a: 'Yes, we use military-grade AES-256 encryption for documents and 2-factor authentication for all critical wallet transactions.' }
      ];
    }
    return data;
  });

  private mapFaqs(payload: unknown): FAQ[] {
    try {
      assertObject(payload, 'support kb response');
      const rows = readArray(payload['articles']);

      return rows.map((row) => {
        const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
        return {
          q: readString(item['title'], 'Support article'),
          a: readString(item['content'], 'No details available.'),
        };
      });
    } catch {
      return [];
    }
  }
}
