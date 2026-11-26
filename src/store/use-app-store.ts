"use client";

import { create } from "zustand";

/**
 * UI state only (search). Navigation uses the Next.js App Router
 * with real URLs: /, /tools/<slug>, /category/<slug>.
 */
interface AppState {
  searchQuery: string;
  setSearch: (q: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  searchQuery: "",
  setSearch: (q) => set({ searchQuery: q }),
}));
