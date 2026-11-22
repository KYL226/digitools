"use client";

import { create } from "zustand";

export type Route =
  | { name: "home" }
  | { name: "category"; category: string }
  | { name: "tool"; slug: string };

interface AppState {
  route: Route;
  searchQuery: string;
  selectedCategory: string | null;
  navigate: (route: Route) => void;
  goHome: () => void;
  goToTool: (slug: string) => void;
  goToCategory: (category: string) => void;
  setSearch: (q: string) => void;
  setCategory: (c: string | null) => void;
}

function parseHash(): Route {
  if (typeof window === "undefined") return { name: "home" };
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (!hash) return { name: "home" };
  const parts = hash.split("/");
  if (parts[0] === "tools" && parts[1]) {
    return { name: "tool", slug: parts[1] };
  }
  if (parts[0] === "categories" && parts[1]) {
    return { name: "category", category: parts[1] };
  }
  return { name: "home" };
}

function routeToHash(route: Route): string {
  switch (route.name) {
    case "home":
      return "";
    case "tool":
      return `#/tools/${route.slug}`;
    case "category":
      return `#/categories/${route.category}`;
    default:
      return "";
  }
}

export const useAppStore = create<AppState>((set) => ({
  // Always start with "home" on both server and client first render to avoid
  // hydration mismatch. The actual hash route is parsed after mount.
  route: { name: "home" },
  searchQuery: "",
  selectedCategory: null,
  navigate: (route) => {
    const hash = routeToHash(route);
    if (typeof window !== "undefined") {
      if (hash) {
        window.location.hash = hash;
      } else if (window.location.hash) {
        // Clear hash for home
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    }
    set({ route });
    // Scroll to top on navigation
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  goHome: () => set({ route: { name: "home" }, searchQuery: "", selectedCategory: null }),
  goToTool: (slug) => set({ route: { name: "tool", slug }, searchQuery: "" }),
  goToCategory: (category) => set({ route: { name: "category", category }, selectedCategory: category }),
  setSearch: (q) => set({ searchQuery: q }),
  setCategory: (c) => set({ selectedCategory: c }),
}));

// On the client, parse the hash AFTER the store is created so that the
// initial render matches the server (both render "home"). This runs in a
// microtask and updates the route before the user sees anything.
if (typeof window !== "undefined") {
  const initialHashRoute = parseHash();
  if (initialHashRoute.name !== "home") {
    // Defer to next tick to avoid hydration mismatch
    Promise.resolve().then(() => {
      useAppStore.setState({ route: initialHashRoute });
    });
  }
  window.addEventListener("hashchange", () => {
    useAppStore.setState({ route: parseHash() });
  });
}
