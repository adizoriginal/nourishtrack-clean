import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  DEFAULT_TIMES,
  ReminderTimes,
  deviceSubscribed,
  disableReminders,
  enableReminders,
  loadReminderTimes,
  notificationPermission,
  pushSupport,
  saveReminderTimes,
  sendTestReminder,
} from "@/lib/push";

const MEALS: { key: keyof ReminderTimes; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
];

/** Meal reminders: a notification at chosen times, only if that meal hasn't been logged */
export const Reminders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const support = pushSupport();
  const [on, setOn] = useState<boolean | null>(null);
  const [times, setTimes] = useState<ReminderTimes>(DEFAULT_TIMES);
  const [savedTimes, setSavedTimes] = useState<ReminderTimes>(DEFAULT_TIMES);
  const [busy, setBusy] = useState<"on" | "off" | "save" | "test" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [subscribed, saved] = await Promise.all([deviceSubscribed(), loadReminderTimes(user.id).catch(() => null)]);
      if (cancelled) return;
      if (saved) {
        setTimes(saved.times);
        setSavedTimes(saved.times);
      }
      setOn(subscribed && !!saved?.enabled);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Scroll here when opened from "remind you to log meals"
  useEffect(() => {
    if (window.location.hash === "#reminders") {
      document.getElementById("reminders")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  if (!user) return null;

  const run = async (kind: NonNullable<typeof busy>, fn: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const changed = MEALS.some((m) => times[m.key] !== savedTimes[m.key]);
  const noneSelected = MEALS.every((m) => !times[m.key]);

  const timeRows = (
    <div className="divide-y rounded-lg border">
      {MEALS.map((m) => {
        const value = times[m.key];
        return (
          <div key={m.key} className="flex items-center justify-between gap-3 p-3">
            <label className="flex items-center gap-3 text-sm font-medium" htmlFor={`rem-${m.key}`}>
              <Switch
                id={`rem-${m.key}`}
                checked={!!value}
                onCheckedChange={(checked) =>
                  setTimes((t) => ({ ...t, [m.key]: checked ? savedTimes[m.key] || DEFAULT_TIMES[m.key] : null }))
                }
              />
              {m.label}
            </label>
            <input
              type="time"
              aria-label={`${m.label} reminder time`}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
              value={value ?? DEFAULT_TIMES[m.key] ?? ""}
              disabled={!value}
              onChange={(e) => setTimes((t) => ({ ...t, [m.key]: e.target.value || null }))}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <Card id="reminders" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="h-5 w-5" /> Meal reminders
        </CardTitle>
        <CardDescription>
          A gentle nudge at the times you choose, only if you haven't logged that meal yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {support === "ios-needs-install" ? (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">On iPhone and iPad, add NourishTrack to your home screen first.</p>
            <p className="mt-1 text-muted-foreground">
              In Safari, tap the Share button, choose "Add to Home Screen", then open NourishTrack from your home
              screen and come back here.
            </p>
          </div>
        ) : support === "unsupported" ? (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            This browser can't show reminders. Try Chrome, Edge, Firefox or Safari on your phone or computer.
          </p>
        ) : on === null ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking...
          </div>
        ) : (
          <>
            {timeRows}

            {notificationPermission() === "denied" && !on && (
              <p className="text-sm text-muted-foreground">
                Notifications are blocked for this site. Allow them in your browser's site settings first.
              </p>
            )}

            {on ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!changed || busy !== null}
                  onClick={() =>
                    run("save", async () => {
                      await saveReminderTimes(user.id, times, true);
                      setSavedTimes(times);
                      toast({ title: "Reminder times saved" });
                    })
                  }
                >
                  {busy === "save" ? "Saving..." : "Save times"}
                </Button>
                <Button
                  variant="outline"
                  disabled={busy !== null}
                  onClick={() =>
                    run("test", async () => {
                      const sent = await sendTestReminder();
                      toast({
                        title: sent > 0 ? "Test reminder sent" : "No device received it",
                        description:
                          sent > 0 ? "It should pop up in a few seconds." : "Try turning reminders off and on again.",
                      });
                    })
                  }
                >
                  {busy === "test" ? "Sending..." : "Send a test"}
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy !== null}
                  onClick={() =>
                    run("off", async () => {
                      await disableReminders(user.id);
                      setOn(false);
                      toast({ title: "Reminders turned off on this device" });
                    })
                  }
                >
                  <BellOff className="h-4 w-4 mr-2" />
                  {busy === "off" ? "Turning off..." : "Turn off"}
                </Button>
              </div>
            ) : (
              <Button
                disabled={busy !== null || noneSelected}
                onClick={() =>
                  run("on", async () => {
                    await enableReminders(user.id, times);
                    setSavedTimes(times);
                    setOn(true);
                    toast({ title: "Reminders are on", description: "We'll nudge you at the times above." });
                  })
                }
              >
                <Bell className="h-4 w-4 mr-2" />
                {busy === "on" ? "Turning on..." : "Turn on reminders"}
              </Button>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Reminders are set per device. Turn them on on each phone or computer you want them on.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
