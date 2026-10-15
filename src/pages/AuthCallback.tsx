import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Where Google (and email links) send people back to after signing in.
export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const finishAuth = async () => {
      // If the person cancelled at Google, or something went wrong, the reason comes back in the address
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const errorDescription = params.get("error_description") || hash.get("error_description");
      if (errorDescription) {
        toast({
          variant: "destructive",
          title: "Sign-in didn't complete",
          description: errorDescription.replace(/\+/g, " "),
        });
        navigate("/auth", { replace: true });
        return;
      }

      // Supabase reads the sign-in details from the address; wait for it to finish
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        toast({
          variant: "destructive",
          title: "Sign-in didn't complete",
          description: "Please try again.",
        });
        navigate("/auth", { replace: true });
        return;
      }

      // New users are taken to the guided setup from here automatically
      navigate("/dashboard", { replace: true });
    };

    finishAuth();
  }, []);

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="text-center space-y-3">
        <div className="mx-auto w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <h2 className="text-xl font-semibold">Signing you in...</h2>
      </div>
    </div>
  );
}
