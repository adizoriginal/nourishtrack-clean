import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = "https://nourishtrack-henna.vercel.app";
const DEFAULT_DESCRIPTION =
  "Track your meals, get a daily calorie target built for your body, and see your progress with NourishTrack.";

interface Meta {
  title: string;
  description?: string;
  /** Pages behind sign-in shouldn't appear in Google */
  noindex?: boolean;
}

const PAGES: Record<string, Meta> = {
  "/": { title: "NourishTrack – Calorie & Nutrition Tracker" },
  "/auth": { title: "Sign in – NourishTrack", description: "Sign in or create your NourishTrack account." },
  "/privacy": { title: "Privacy Policy – NourishTrack", description: "How NourishTrack collects, uses and protects your information." },
  "/terms": { title: "Terms of Service – NourishTrack", description: "The terms for using NourishTrack." },
  "/contact": { title: "Contact – NourishTrack", description: "Get in touch with the NourishTrack team." },
  "/dashboard": { title: "Dashboard – NourishTrack", noindex: true },
  "/food-diary": { title: "Food Diary – NourishTrack", noindex: true },
  "/progress": { title: "Progress – NourishTrack", noindex: true },
  "/profile": { title: "Profile – NourishTrack", noindex: true },
  "/onboarding": { title: "Set up your plan – NourishTrack", noindex: true },
  "/auth/v1/callback": { title: "Signing in – NourishTrack", noindex: true },
};

const NOT_FOUND: Meta = { title: "Page not found – NourishTrack", noindex: true };

const setMeta = (selector: string, attr: string, key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

/** Keeps the browser tab title, description and canonical link in step with the current page. */
export const PageMeta = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = PAGES[pathname] ?? NOT_FOUND;
    const description = meta.description ?? DEFAULT_DESCRIPTION;

    document.title = meta.title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", meta.title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[name="robots"]', "name", "robots", meta.noindex ? "noindex, nofollow" : "index, follow");

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${SITE}${pathname === "/" ? "/" : pathname}`;
  }, [pathname]);

  return null;
};
