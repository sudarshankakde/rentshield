import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly storageKey = 'rentshield.theme';
  theme = signal<'light' | 'dark'>(this.readStored());

  constructor() {
    this.apply();
  }

  toggle() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    this.apply();
  }

  set(theme: 'light' | 'dark') {
    this.theme.set(theme);
    this.apply();
  }

  isDark() {
    return this.theme() === 'dark';
  }

  private apply() {
    const t = this.theme();
    if (typeof document !== 'undefined') {
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
    }
    try { localStorage.setItem(this.storageKey, t); } catch {}
  }

  private readStored(): 'light' | 'dark' {
    try {
      const v = localStorage.getItem(this.storageKey);
      return v === 'dark' ? 'dark' : 'light';
    } catch { return 'light'; }
  }
}
