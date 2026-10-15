import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Share, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canPromptInstall, isIOS, isStandalone, onInstallChange, promptInstall } from "@/lib/pwa";

const DISMISS_KEY = "nourishtrack:install-dismissed";

const dismissedRecently = () => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && Date.now() - at < 1000 * 60 * 60 * 24 * 30; // hide for 30 days
  } catch {
    return false;
  }
};

/** "Add NourishTrack to your home screen" — only shown when the app isn't installed yet */
export const InstallCard = () => {
  const [, refresh] = useState(0);
  const [hidden, setHidden] = useState(() => isStandalone() || dismissedRecently());
  const [showIosSteps, setShowIosSteps] = useState(false);

  useEffect(() => onInstallChange(() => refresh((n) => n + 1)), []);

  const ios = isIOS();
  if (hidden || (!canPromptInstall() && !ios)) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  return (
    <div className="relative flex flex-col gap-3 rounded-xl border bg-primary/5 p-4 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:text-foreground"
        aria-label="Hide"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Smartphone className="h-5 w-5" />
        </div>
        <div className="text-sm">
          <div className="font-medium">Get NourishTrack on your home screen</div>
          <div className="text-muted-foreground">
            Opens like an app, loads faster and can{" "}
            <Link to="/profile#reminders" className="underline underline-offset-2 hover:text-foreground">
              remind you to log meals
            </Link>
            .
          </div>
          {ios && showIosSteps && (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>
                Tap the Share button <Share className="inline h-3.5 w-3.5 -mt-0.5" /> at the bottom of Safari
              </li>
              <li>Choose "Add to Home Screen"</li>
              <li>Open NourishTrack from your home screen</li>
            </ol>
          )}
        </div>
      </div>
      <div className="sm:ml-auto sm:pr-6">
        {canPromptInstall() ? (
          <Button
            size="sm"
            onClick={async () => {
              if (await promptInstall()) setHidden(true);
            }}
          >
            <Download className="h-4 w-4 mr-2" /> Install app
          </Button>
        ) : (
          !showIosSteps && (
            <Button size="sm" variant="outline" onClick={() => setShowIosSteps(true)}>
              Show me how
            </Button>
          )
        )}
      </div>
    </div>
  );
};
