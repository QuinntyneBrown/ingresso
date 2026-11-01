import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

export type ThemePreference = 'system' | 'light' | 'dark';

const KEY = 'ingresso.theme';

/**
 * The theme the person chose: Light, Dark, or follow the system (L2-044). It is kept in this browser's local
 * storage, so it is per device and works before sign-in (ADR 0013). With no choice the stylesheet follows
 * `prefers-color-scheme`; a choice sets `data-theme` on the root element.
 */
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly root = inject(DOCUMENT).documentElement;
  readonly preference = signal<ThemePreference>('system');

  constructor() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') this.preference.set(saved);
    } catch {
      // Storage can be blocked; the app then follows the system theme.
    }
    this.apply();
  }

  choose(preference: ThemePreference): void {
    this.preference.set(preference);
    try {
      if (preference === 'system') localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, preference);
    } catch {
      // The choice still applies for this visit.
    }
    this.apply();
  }

  private apply(): void {
    const preference = this.preference();
    if (preference === 'system') this.root.removeAttribute('data-theme');
    else this.root.setAttribute('data-theme', preference);
  }
}
