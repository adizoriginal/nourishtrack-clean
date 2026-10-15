import { lazy, ComponentType } from "react";

const RELOAD_KEY = "nourishtrack:chunk-reload";

/**
 * Load a page only when someone visits it.
 * After a new deploy, a tab that was already open may ask for a file that no longer exists;
 * in that case reload once to pick up the new version instead of showing a blank page.
 */
export function lazyPage<T extends ComponentType<unknown>>(load: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const mod = await load();
      try {
        sessionStorage.removeItem(RELOAD_KEY);
      } catch {
        /* ignore */
      }
      return mod;
    } catch (error) {
      let alreadyReloaded = false;
      try {
        alreadyReloaded = sessionStorage.getItem(RELOAD_KEY) === "1";
        if (!alreadyReloaded) sessionStorage.setItem(RELOAD_KEY, "1");
      } catch {
        /* ignore */
      }
      if (!alreadyReloaded) {
        window.location.reload();
        return new Promise<{ default: T }>(() => {}); // wait for the reload
      }
      throw error;
    }
  });
}
