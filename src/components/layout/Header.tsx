import { Link } from "react-router-dom";
import { MenuIcon, User, PieChart, Calendar, LineChart, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setMobileMenuOpen(false);
    }
  }, [isMobile]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (mobileMenuOpen && !target.closest('#mobile-menu') && !target.closest('#menu-button')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    }
  };

  const navLinks = session ? [
    { to: "/dashboard", label: "Dashboard", icon: PieChart },
    { to: "/food-diary", label: "Food Diary", icon: Calendar },
    { to: "/progress", label: "Progress", icon: LineChart },
    { to: "/profile", label: "Profile", icon: User },
  ] : [];

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center space-x-2">
          <span className="h-8 w-8 rounded-full bg-nourish-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </span>
          <span className="font-bold text-xl text-foreground">NourishTrack</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
            >
              <link.icon className="h-4 w-4 mr-2" />
              {link.label}
            </Link>
          ))}
          {session ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="flex items-center"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          id="menu-button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMobileMenu}
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div 
          id="mobile-menu"
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-200 ease-in-out"
        >
          <div className="absolute right-0 top-0 h-screen w-64 bg-background shadow-lg transform translate-x-0 transition-transform duration-200 ease-in-out">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold">Menu</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-col p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center px-4 py-3 hover:bg-muted rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="h-5 w-5 mr-3" />
                  {link.label}
                </Link>
              ))}
              {session ? (
                <Button 
                  variant="ghost" 
                  className="flex items-center justify-start px-4 py-3"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  className="flex items-center justify-start px-4 py-3"
                  onClick={() => {
                    navigate("/auth");
                    setMobileMenuOpen(false);
                  }}
                >
                  <User className="h-5 w-5 mr-3" />
                  Sign In
                </Button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
