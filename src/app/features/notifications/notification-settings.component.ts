import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bell, CheckCheck, Trash2, RefreshCw } from 'lucide-angular';
import { RentShieldApiService } from '../../core/api/rentshield-api.service';
import { ToastService } from '../../core/services/toast.service';
import { createRequestState } from '../../core/services/request-state.service';

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
    <div class="max-w-3xl mx-auto space-y-6 pb-20">
      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-[10px] font-black uppercase tracking-widest text-brand">Notifications</p>
          <h1 class="text-3xl font-black tracking-tight mt-1">Your Alerts</h1>
          <p class="text-muted-var text-sm mt-1">
            <span *ngIf="unreadCount() > 0" class="text-brand font-black">{{ unreadCount() }} unread</span>
            <span *ngIf="unreadCount() === 0" class="text-muted-var">All caught up</span>
            &nbsp;· {{ notifications().length }} total
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="load()" class="w-9 h-9 border border-muted flex items-center justify-center text-muted-var hover:text-brand hover:border-brand transition-colors" title="Refresh">
            <span style="display:inline-flex;align-items:center">
              <lucide-icon [name]="RefreshIcon" size="15"></lucide-icon>
            </span>
          </button>
          <button *ngIf="unreadCount() > 0" (click)="markAllRead()"
                  class="h-9 px-4 border border-muted text-xs font-black uppercase tracking-widest text-muted-var hover:text-brand hover:border-brand transition-colors flex items-center gap-2">
            <span style="display:inline-flex;align-items:center">
              <lucide-icon [name]="CheckAllIcon" size="14"></lucide-icon>
            </span>
            Mark all read
          </button>
        </div>
      </div>

      <div *ngIf="error()" class="border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
        {{ error() }}
      </div>

      <div *ngIf="success()" class="border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
        {{ success() }}
      </div>

      <!-- Loading skeleton -->
      <div *ngIf="loading()" class="space-y-3">
        <div *ngFor="let i of [1,2,3,4]" class="h-20 bg-surface-soft border border-muted animate-pulse"></div>
      </div>

      <!-- Notification list -->
      <div *ngIf="!loading()" class="space-y-2">
        <div *ngFor="let n of notifications()"
             class="border p-4 transition-all"
             [class.border-brand]="!n.isRead"
             [class.border-muted]="n.isRead"
             [class.bg-surface]="!n.isRead"
             [class.bg-surface-soft]="n.isRead">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span *ngIf="!n.isRead" class="w-2 h-2 bg-brand shrink-0"></span>
                <span class="text-[9px] font-black uppercase tracking-widest text-muted-var">{{ n.type }}</span>
              </div>
              <p class="text-sm font-black leading-tight" [class.text-brand]="!n.isRead">{{ n.title }}</p>
              <p class="text-xs text-muted-var mt-1 leading-relaxed">{{ n.message }}</p>
              <p class="text-[10px] text-muted-var mt-2 font-black">{{ n.createdAt | date:'MMM d, h:mm a' }}</p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <button *ngIf="!n.isRead" (click)="markRead(n)"
                      class="w-8 h-8 border border-muted text-muted-var hover:text-brand hover:border-brand flex items-center justify-center transition-colors"
                      title="Mark as read">
                <span style="display:inline-flex;align-items:center">
                  <lucide-icon [name]="CheckAllIcon" size="13"></lucide-icon>
                </span>
              </button>
              <button (click)="deleteNotification(n)"
                      class="w-8 h-8 border border-muted text-muted-var hover:text-danger hover:border-danger flex items-center justify-center transition-colors"
                      title="Delete">
                <span style="display:inline-flex;align-items:center">
                  <lucide-icon [name]="TrashIcon" size="13"></lucide-icon>
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="notifications().length === 0" class="border border-muted bg-surface-soft p-16 text-center">
          <div class="w-14 h-14 bg-surface border border-muted flex items-center justify-center mx-auto mb-4">
            <span style="display:inline-flex;align-items:center">
              <lucide-icon [name]="BellIcon" size="24" class="text-muted-var"></lucide-icon>
            </span>
          </div>
          <p class="text-sm font-black text-muted-var uppercase tracking-widest">No notifications</p>
          <p class="text-xs text-muted-var mt-2">You're all caught up. New alerts will appear here.</p>
        </div>
      </div>
    </div>
  `
})
export class NotificationSettingsComponent implements OnInit {
  private readonly api = inject(RentShieldApiService);
  private readonly toast = inject(ToastService);
  private readonly state = createRequestState<unknown>(null);

  readonly BellIcon = Bell;
  readonly CheckAllIcon = CheckCheck;
  readonly TrashIcon = Trash2;
  readonly RefreshIcon = RefreshCw;

  notifications = signal<Notification[]>([]);
  loading = this.state.loading;
  error = this.state.error;
  success = this.state.success;

  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  ngOnInit() {
    this.load();
  }

  async load() {
    const res = await this.state.runObservable(this.api.notifications.list(), {
      errorMessage: 'Could not load notifications.',
      preserveSuccess: true,
    });

    if (!res) {
      this.notifications.set([]);
      return;
    }

    const data = res as Record<string, unknown>;
    const rows = Array.isArray(data['notifications']) ? data['notifications'] as Notification[] : [];
    this.notifications.set(rows);
  }

  async markRead(n: Notification) {
    const result = await this.state.runObservable(this.api.notifications.markRead(n.id), {
      errorMessage: 'Could not mark as read.',
      successMessage: 'Notification marked as read.',
      preserveSuccess: true,
    });

    if (!result) {
      this.toast.error(this.error() ?? 'Could not mark as read.');
      return;
    }

    this.notifications.update(list => list.map(item => item.id === n.id ? { ...item, isRead: true } : item));
  }

  async markAllRead() {
    const result = await this.state.runObservable(this.api.notifications.markAllRead(), {
      errorMessage: 'Could not update notifications.',
      successMessage: 'All notifications marked as read.',
      preserveSuccess: true,
    });

    if (!result) {
      this.toast.error(this.error() ?? 'Could not update notifications.');
      return;
    }

    this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
    this.toast.success(this.success() ?? 'All notifications marked as read.');
  }

  async deleteNotification(n: Notification) {
    const result = await this.state.runObservable(this.api.notifications.delete(n.id), {
      errorMessage: 'Could not delete notification.',
      successMessage: 'Notification deleted.',
      preserveSuccess: true,
    });

    if (!result) {
      this.toast.error(this.error() ?? 'Could not delete notification.');
      return;
    }

    this.notifications.update(list => list.filter(item => item.id !== n.id));
  }
}
