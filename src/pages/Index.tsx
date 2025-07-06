import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AppleIcon, BarChart2, CalendarDays, RocketIcon, ShieldCheck, Utensils, Brain } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-nourish-50 to-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
                Track Your Diet, <br />
                <span className="text-nourish-600">Transform Your Life</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                NourishTrack helps you maintain a healthy lifestyle by tracking your nutrition, setting goals, and monitoring your progress.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link to="/dashboard">
                    <RocketIcon className="h-5 w-5" />
                    Get Started
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/food-diary">Explore Features</Link>
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-80 h-80 bg-nourish-400 rounded-full flex items-center justify-center">
                <AppleIcon className="h-32 w-32 text-white" />
                <div className="absolute -top-4 -right-4 bg-secondary text-white p-4 rounded-full">
                  <Utensils className="h-8 w-8" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-primary text-white p-4 rounded-full">
                  <BarChart2 className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Everything You Need to Stay Healthy</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              NourishTrack provides all the tools you need to maintain a balanced diet and achieve your health goals.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-nourish-100 rounded-lg flex items-center justify-center mb-4">
                <Utensils className="h-6 w-6 text-nourish-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Food Tracking</h3>
              <p className="text-muted-foreground">
                Easily log your meals and track your daily calorie and macronutrient intake.
              </p>
            </div>
            
            <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart2 className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Progress Monitoring</h3>
              <p className="text-muted-foreground">
                Visualize your progress with intuitive charts and stay motivated on your health journey.
              </p>
            </div>
            
            <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <CalendarDays className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Daily Planning</h3>
              <p className="text-muted-foreground">
                Plan your meals ahead of time and maintain consistency in your diet.
              </p>
            </div>
            
            <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-nourish-100 rounded-lg flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-nourish-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Meal Recommendations</h3>
              <p className="text-muted-foreground">
                Get personalized meal suggestions based on your profile and nutrition goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-nourish-500 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
              <p className="text-nourish-50 max-w-xl">
                Join NourishTrack today and take the first step towards a healthier lifestyle.
              </p>
            </div>
            <Button asChild size="lg" variant="secondary" className="min-w-[150px]">
              <Link to="/dashboard">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section - Remove Partners and Keep Section Structure */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-center mb-8">
            <ShieldCheck className="h-12 w-12 text-nourish-600 mr-4" />
            <h2 className="text-2xl font-bold">Trusted Health Tracking</h2>
          </div>
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-muted-foreground">
              NourishTrack is built with your health in mind. Our platform is designed to help you maintain a healthy lifestyle with reliability and ease.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
