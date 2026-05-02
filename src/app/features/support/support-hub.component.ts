import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, HelpCircle, MessageCircle, Phone, Mail } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { ToastService } from '../../core/services/toast.service';
import { assertObject, readArray, readString } from '../../core/api/request-validation';
import { createRequestState } from '../../core/services/request-state.service';

@Component({
  selector: 'app-support-hub',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-12 max-w-5xl mx-auto pb-20">
      <div *ngIf="error()" class="border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
        {{ error() }}
      </div>

      <div *ngIf="loading()" class="border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">
        Loading support content...
      </div>

      <div class="text-center">
        <h2 class="text-4xl font-black text-slate-900 tracking-tight">Support Hub</h2>
        <p class="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">How can we help you today?</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm text-center card-hover">
           <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <lucide-icon [name]="ChatIcon" size="32"></lucide-icon>
           </div>
           <h3 class="text-xl font-black text-slate-900 mb-2">Live Chat</h3>
           <p class="text-sm text-slate-500 mb-6 font-medium">Average wait time: 2 mins</p>
           <button class="w-full bg-blue-600 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest">Start Chat</button>
        </div>

        <div class="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm text-center card-hover">
           <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <lucide-icon [name]="PhoneIcon" size="32"></lucide-icon>
           </div>
           <h3 class="text-xl font-black text-slate-900 mb-2">Call Support</h3>
           <p class="text-sm text-slate-500 mb-6 font-medium">Available 24/7</p>
           <button class="w-full bg-emerald-600 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest">+1800-RENT-HELP</button>
        </div>

        <div class="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm text-center card-hover">
           <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <lucide-icon [name]="MailIcon" size="32"></lucide-icon>
           </div>
           <h3 class="text-xl font-black text-slate-900 mb-2">Email Us</h3>
           <p class="text-sm text-slate-500 mb-6 font-medium">Response within 24 hours</p>
           <button class="w-full bg-indigo-600 text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest">support&#64;rentshield.com</button>
        </div>
      </div>

      <div class="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 class="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
           <lucide-icon [name]="HelpIcon" size="32" class="text-amber-500"></lucide-icon>
           Frequently Asked Questions
        </h3>
        <div class="space-y-6">
           <div *ngFor="let faq of faqs()" class="group pb-6 border-b border-slate-50">
              <h4 class="font-black text-slate-900 text-lg group-hover:text-amber-600 transition-colors cursor-pointer mb-2">{{faq.q}}</h4>
              <p class="text-slate-500 font-medium leading-relaxed">{{faq.a}}</p>
           </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-hover { @apply transition-all duration-300 hover:shadow-xl hover:-translate-y-2; }
  `]
})
export class SupportHubComponent implements OnInit {
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);
  private readonly state = createRequestState<unknown>(null);

  readonly ChatIcon = MessageCircle;
  readonly PhoneIcon = Phone;
  readonly MailIcon = Mail;
  readonly HelpIcon = HelpCircle;

  faqs = signal<Array<{ q: string; a: string }>>([]);
  loading = this.state.loading;
  error = this.state.error;

  async ngOnInit(): Promise<void> {
    const response = await this.state.runObservable(this.api.support.searchKb(), {
      errorMessage: 'Failed to load support knowledge base.',
    });

    if (!response) {
      this.toast.error(this.error() ?? 'Failed to load support knowledge base.');
      return;
    }

    this.faqs.set(this.mapFaqs(response));
  }

  private mapFaqs(payload: unknown): Array<{ q: string; a: string }> {
    assertObject(payload, 'support kb response');
    const rows = readArray(payload['articles']);

    return rows.map((row) => {
      const item = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
      return {
        q: readString(item['title'], 'Support article'),
        a: readString(item['content'], 'No details available.'),
      };
    });
  }
}
