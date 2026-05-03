import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bell, CheckCheck, Trash2, RefreshCw, Filter, BellRing } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { ToastService } from '../../core/services/toast.service';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="max-w-4xl mx-auto space-y-8 pb-20">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div class="flex items-center gap-3 mb-2">
             <div class="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center border border-brand-primary/20 shadow-inner">
               <lucide-icon [name]="BellIcon" size="20"></lucide-icon>
             </div>
             <p class="text-brand-primary font-bold uppercase tracking-widest text-[10px] drop-shadow-sm">Real-time alerts</p>
          </div>
          <h1 class="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Your Alerts</h1>
          <p class="text-text-muted text-sm mt-2 font-medium">
            <span *ngIf="unreadCount() > 0" class="text-brand-primary font-black px-2 py-0.5 bg-brand-primary/10 rounded-md border border-brand-primary/20">{{ unreadCount() }} unread</span>
            <span *ngIf="unreadCount() === 0" class="text-emerald-500 font-black px-2 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">All caught up</span>
            <span class="opacity-50 ml-2">· {{ notifications().length }} total</span>
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="notificationsQuery.refetch()" 
                  [disabled]="notificationsQuery.isFetching()"
                  class="w-12 h-12 rounded-[1.25rem] bg-surface border border-border flex items-center justify-center text-text-muted hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all shadow-sm">
            <lucide-icon [name]="RefreshIcon" size="20" [class.animate-spin]="notificationsQuery.isFetching()"></lucide-icon>
          </button>
          <button *ngIf="unreadCount() > 0" 
                  (click)="markAllReadMutation.mutate()"
                  [disabled]="markAllReadMutation.isPending()"
                  class="h-12 px-6 rounded-[1.25rem] bg-surface border border-border text-xs font-black uppercase tracking-widest text-text-muted hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50">
            <lucide-icon [name]="CheckAllIcon" size="16"></lucide-icon>
            {{ markAllReadMutation.isPending() ? 'Marking...' : 'Mark all read' }}
          </button>
        </div>
      </div>

      <div *ngIf="notificationsQuery.error() as error" class="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-700 shadow-sm flex items-center gap-3">
        <lucide-icon [name]="FilterIcon" size="20"></lucide-icon>
        {{ error.message || 'Failed to load notifications.' }}
      </div>

      <!-- Loading skeleton -->
      <div *ngIf="notificationsQuery.isLoading()" class="space-y-4">
        <div *ngFor="let i of [1,2,3,4]" class="h-28 bg-surface-soft border border-border rounded-[2rem] animate-pulse"></div>
      </div>

      <!-- Notification list -->
      <div *ngIf="!notificationsQuery.isLoading() && !notificationsQuery.error()" class="space-y-4">
        <div *ngFor="let n of notifications()"
             class="p-6 rounded-[2rem] border transition-all duration-300 relative overflow-hidden group hover:shadow-md"
             [ngClass]="n.isRead ? 'bg-surface-soft border-border' : 'bg-surface border-brand-primary/30 shadow-sm shadow-brand-primary/5 hover:border-brand-primary/50'">
          
          <div *ngIf="!n.isRead" class="absolute left-0 top-0 w-1.5 h-full bg-gradient-to-b from-brand-primary to-brand-primary-dark opacity-80"></div>
             
          <div class="flex items-start justify-between gap-6 pl-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm"
                      [ngClass]="n.isRead ? 'bg-surface border-border text-text-muted' : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20'">
                  {{ n.type }}
                </span>
                <span *ngIf="!n.isRead" class="flex items-center gap-1.5 text-[10px] text-brand-primary font-black uppercase tracking-widest animate-pulse">
                  <div class="w-1.5 h-1.5 rounded-full bg-brand-primary"></div>
                  New
                </span>
              </div>
              <p class="text-lg font-black leading-tight mb-2 tracking-tight transition-colors" 
                 [ngClass]="n.isRead ? 'text-text' : 'text-brand-primary'">{{ n.title }}</p>
              <p class="text-sm text-text-muted leading-relaxed max-w-2xl">{{ n.message }}</p>
              <p class="text-[10px] text-text-soft mt-3 font-black uppercase tracking-widest">{{ n.createdAt | date:'MMM d, h:mm a' }}</p>
            </div>
            <div class="flex flex-col sm:flex-row items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button *ngIf="!n.isRead" 
                      (click)="markReadMutation.mutate(n)"
                      class="w-10 h-10 rounded-xl bg-surface border border-border text-text-muted hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-500/10 flex items-center justify-center transition-all shadow-sm"
                      title="Mark as read">
                <lucide-icon [name]="CheckAllIcon" size="16"></lucide-icon>
              </button>
              <button (click)="deleteMutation.mutate(n)"
                      class="w-10 h-10 rounded-xl bg-surface border border-border text-text-muted hover:text-rose-500 hover:border-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-all shadow-sm"
                      title="Delete">
                <lucide-icon [name]="TrashIcon" size="16"></lucide-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="notifications().length === 0" class="border border-border bg-surface-soft rounded-[3rem] p-16 text-center flex flex-col items-center">
          <div class="w-24 h-24 bg-surface rounded-[2rem] border border-border flex items-center justify-center mb-6 shadow-inner">
             <lucide-icon [name]="BellRingIcon" size="48" class="text-text-soft"></lucide-icon>
          </div>
          <h3 class="text-2xl font-black text-text tracking-tight mb-2">No notifications</h3>
          <p class="text-sm font-bold text-text-muted max-w-sm">You're all caught up. New alerts and updates will appear here when they arrive.</p>
        </div>
      </div>
    </div>
  `
})
export class NotificationSettingsComponent {
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);
  private readonly queryClient = injectQueryClient();

  readonly BellIcon = Bell;
  readonly BellRingIcon = BellRing;
  readonly CheckAllIcon = CheckCheck;
  readonly TrashIcon = Trash2;
  readonly RefreshIcon = RefreshCw;
  readonly FilterIcon = Filter;

  notificationsQuery = injectQuery(() => ({
    queryKey: ['notifications-list'],
    queryFn: async () => {
      const res = await firstValueFrom(this.api.notifications.list());
      if (!res) return [];
      const data = res as Record<string, unknown>;
      return Array.isArray(data['notifications']) ? data['notifications'] as Notification[] : [];
    }
  }));

  notifications = computed(() => this.notificationsQuery.data() || []);
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  markReadMutation = injectMutation(() => ({
    mutationFn: async (n: Notification) => {
      return await firstValueFrom(this.api.notifications.markRead(n.id));
    },
    onSuccess: (_, n) => {
      this.queryClient.setQueryData(['notifications-list'], (old: Notification[] | undefined) => {
        if (!old) return [];
        return old.map(item => item.id === n.id ? { ...item, isRead: true } : item);
      });
    },
    onError: (error: any) => {
      this.toast.error(error.message || 'Could not mark as read.');
    }
  }));

  markAllReadMutation = injectMutation(() => ({
    mutationFn: async () => {
      return await firstValueFrom(this.api.notifications.markAllRead());
    },
    onSuccess: () => {
      this.toast.success('All notifications marked as read.');
      this.queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
    },
    onError: (error: any) => {
      this.toast.error(error.message || 'Could not update notifications.');
    }
  }));

  deleteMutation = injectMutation(() => ({
    mutationFn: async (n: Notification) => {
      return await firstValueFrom(this.api.notifications.delete(n.id));
    },
    onSuccess: (_, n) => {
      this.queryClient.setQueryData(['notifications-list'], (old: Notification[] | undefined) => {
        if (!old) return [];
        return old.filter(item => item.id !== n.id);
      });
      this.toast.success('Notification deleted.');
    },
    onError: (error: any) => {
      this.toast.error(error.message || 'Could not delete notification.');
    }
  }));
}
