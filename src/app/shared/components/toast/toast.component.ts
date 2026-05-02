import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { LucideAngularModule, CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-angular';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div 
          [id]="'toast-' + toast.id"
          class="toast-item pointer-events-auto flex items-center gap-4 p-4 rounded-2xl shadow-2xl border min-w-[320px] max-w-[450px] transition-all bg-surface"
          [ngClass]="{
            'toast-success': toast.type === 'success',
            'toast-error': toast.type === 'error',
            'toast-warning': toast.type === 'warning',
            'toast-info': toast.type === 'info'
          }"
        >
          <div class="flex-shrink-0">
            @switch (toast.type) {
              @case ('success') { <lucide-icon [name]="CheckIcon" size="20" class="text-emerald-600"></lucide-icon> }
              @case ('error') { <lucide-icon [name]="ErrorIcon" size="20" class="text-rose-600"></lucide-icon> }
              @case ('warning') { <lucide-icon [name]="WarningIcon" size="20" class="text-amber-600"></lucide-icon> }
              @case ('info') { <lucide-icon [name]="InfoIcon" size="20" class="text-indigo-600"></lucide-icon> }
            }
          </div>
          <div class="flex-grow">
            <p class="text-sm font-black tracking-tight leading-tight">{{ toast.message }}</p>
          </div>
          <button (click)="toastService.remove(toast.id)" class="text-slate-400 hover:text-slate-600 transition-colors">
            <lucide-icon [name]="CloseIcon" size="16"></lucide-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-item {
      animation: slideIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(40px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);

  readonly CheckIcon = CheckCircle;
  readonly ErrorIcon = AlertCircle;
  readonly InfoIcon = Info;
  readonly WarningIcon = AlertTriangle;
  readonly CloseIcon = X;
}
