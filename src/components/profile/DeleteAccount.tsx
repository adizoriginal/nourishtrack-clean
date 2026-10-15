import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cleanupAuthState } from "@/components/auth/AuthCleanup";

/** Lets people permanently delete their account and data themselves. */
export const DeleteAccount = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmed = typed.trim().toUpperCase() === "DELETE";

  const remove = async () => {
    if (!confirmed) return;
    setDeleting(true);
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke("delete-account", {
      body: { confirm: "DELETE" },
    });
    if (fnError || !data?.success) {
      setDeleting(false);
      let message = "Couldn't delete your account. Please try again, or contact us.";
      try {
        const body = await (fnError as { context?: Response })?.context?.json?.();
        if (body?.error) message = body.error;
      } catch {
        /* keep the generic message */
      }
      setError(message);
      return;
    }

    // Account is gone: clear the session on this device and go home
    try {
      await supabase.auth.signOut();
    } catch {
      /* the session no longer exists anyway */
    }
    cleanupAuthState();
    toast({ title: "Your account has been deleted", description: "All your data has been removed." });
    navigate("/", { replace: true });
  };

  return (
    <>
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg">Delete account</CardTitle>
          <CardDescription>
            Permanently delete your account, food diary, weight history, water log, goals and saved meals. This
            can't be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete my account
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (deleting) return;
          setOpen(o);
          if (!o) {
            setTyped("");
            setError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently removes your account and everything in it. You won't be able to get it back.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              disabled={deleting}
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>
              Keep my account
            </Button>
            <Button variant="destructive" onClick={remove} disabled={!confirmed || deleting}>
              {deleting ? "Deleting..." : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
