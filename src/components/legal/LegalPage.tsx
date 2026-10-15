import { ReactNode, useEffect } from "react";

interface LegalPageProps {
  title: string;
  updated: string;
  children: ReactNode;
}

/** Shared layout for the Privacy Policy and Terms pages */
export const LegalPage = ({ title, updated, children }: LegalPageProps) => {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} – NourishTrack`;
    window.scrollTo(0, 0);
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {updated}</p>
      <div className="space-y-6 leading-relaxed text-foreground/90 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-nourish-700 [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </div>
  );
};

export const CONTACT_EMAIL = "nourishtrackapp@gmail.com";
