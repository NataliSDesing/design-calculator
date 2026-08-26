import type { ServiceConfig } from '../data/pricing';

export interface SharedState {
  configs: ServiceConfig[];
  urgency: 'normal' | 'fast' | 'emergency';
  extras: string[];
}

export function encodeState(state: SharedState): string {
  try {
    const json = JSON.stringify(state);
    return btoa(encodeURIComponent(json));
  } catch {
    return '';
  }
}

export function decodeState(hash: string): SharedState | null {
  try {
    const json = decodeURIComponent(atob(hash));
    const parsed = JSON.parse(json) as SharedState;
    if (!parsed.configs || !Array.isArray(parsed.configs)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getShareUrl(state: SharedState): string {
  const encoded = encodeState(state);
  if (!encoded) return window.location.href.split('#')[0];
  const base = window.location.origin + window.location.pathname;
  return `${base}#${encoded}`;
}

export function readStateFromUrl(): SharedState | null {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  return decodeState(hash);
}
