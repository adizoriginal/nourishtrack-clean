
import { ProfileCard } from "@/components/profile/ProfileCard";
import { MealPlanList } from "@/components/profile/MealPlanList";
import { UnlimitedMealRecommendations } from "@/components/profile/UnlimitedMealRecommendations";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center p-6 bg-muted/20 rounded-lg space-y-4">
          <h2 className="text-2xl font-bold">Sign In Required</h2>
          <p>Please sign in to access your profile settings and meal plans.</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      <div className="grid gap-8 lg:grid-cols-[400px,1fr]">
        <ProfileCard />
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Saved Meal Plans</h2>
            <MealPlanList />
          </div>
          <div>
            <h2 className="text-2xl font-semibold mb-4">Generate New Meals</h2>
            <UnlimitedMealRecommendations />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
