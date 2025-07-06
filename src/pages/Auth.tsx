import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import PasswordResetForm from "@/components/auth/PasswordResetForm";
import { cleanupAuthState } from "@/components/auth/AuthCleanup";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const isResetMode = searchParams.get("mode") === "reset";

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery initiated");
      } else if (event === "SIGNED_IN" && session) {
        setTimeout(() => {
          navigate("/dashboard");
        }, 100);
      }
    });
  }, [navigate]);

  if (isResetMode) {
    return <PasswordResetForm />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      cleanupAuthState();

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) throw error;

        toast({
          title: "Success!",
          description: "Please check your email to verify your account.",
        });
      } else {
        try {
          await supabase.auth.signOut({ scope: "global" });
        } catch (err) {}

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // ✅ Better redirect
        navigate("/dashboard");
      }
    } catch (error: any) {
      let errorMessage = error.message;

      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage =
          "Please check your email and confirm your account before signing in.";
      } else if (error.message.includes("User already registered")) {
        errorMessage =
          "An account with this email already exists. Please sign in instead.";
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your email address",
      });
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) throw error;

      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions.",
      });
      setShowForgotPassword(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setResetLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter your email address and we'll send you a link to reset your
              password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email address"
                />
              </div>
              <Button type="submit" className="w-full" disabled={resetLoading}>
                {resetLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{isSignUp ? "Create Account" : "Welcome Back"}</CardTitle>
          <CardDescription>
            {isSignUp
              ? "Sign up to start tracking your nutrition"
              : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Loading..."
                : isSignUp
                ? "Create Account"
                : "Sign In"}
            </Button>

            {!isSignUp && (
              <Button
                type="button"
                variant="link"
                className="w-full text-sm"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot your password?
              </Button>
            )}

            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
