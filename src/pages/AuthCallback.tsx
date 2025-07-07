import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const finishAuth = async () => {
      const { error } = await supabase.auth.getSession(); // triggers AuthProvider
      if (error) console.error("Callback session error:", error.message);

      navigate("/dashboard");
    };

    finishAuth();
  }, []);
// Ensure this file is properly exported for Vercel
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Logging you in...</h2>
      </div>
    </div>
  );
}
