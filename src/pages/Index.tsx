import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Brain, LineChart, Target, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";

const features = [
  {
    icon: Utensils,
    title: "Log any meal in seconds",
    text: "Search thousands of foods, or quick-add your own home-cooked dishes from any cuisine. Foods you eat often are one tap away.",
  },
  {
    icon: Target,
    title: "A target built for you",
    text: "Answer four quick questions and get daily calorie, protein, carb and fat goals worked out for your body and your goal.",
  },
  {
    icon: LineChart,
    title: "See your progress",
    text: "Track your daily totals against your goals, see your macro balance, and log your weight to watch the trend over time.",
  },
  {
    icon: Brain,
    title: "Meal ideas that fit",
    text: "Get recipe suggestions that match your calorie goals and dietary preferences, from vegetarian to gluten-free.",
  },
];

const steps = [
  {
    title: "Create your account",
    text: "Sign up with your email and answer four quick questions about you, your activity and your goal.",
  },
  {
    title: "Get your daily plan",
    text: "NourishTrack works out how many calories and how much protein, carbs and fat you need each day.",
  },
  {
    title: "Log meals and stay on track",
    text: "Add what you eat through the day and see exactly how close you are to your goals.",
  },
];

const faqs = [
  {
    q: "How is my calorie target calculated?",
    a: "We use the Mifflin-St Jeor equation, the formula dietitians most often use, to estimate how much energy your body uses from your age, sex, height and weight. We then adjust for your activity level and your goal. To lose weight, for example, we set your target about 500 kcal below what you burn, and never below a safe minimum.",
  },
  {
    q: "What if a food isn't in the search?",
    a: "Food search covers thousands of everyday foods, from rice and eggs to fruit and vegetables. For home-cooked or regional dishes, use Quick add to enter the name and calories. NourishTrack remembers them, so next time they're a single tap.",
  },
  {
    q: "Who can see my food diary?",
    a: "Only you. Your meals, weight and goals are tied to your account and protected so other users can't read them.",
  },
  {
    q: "Can I change my goals later?",
    a: "Any time. Go to Profile, then Goals. You can edit the numbers yourself or tap “Recalculate my targets” to run the setup again.",
  },
  {
    q: "Is this medical advice?",
    a: "No. NourishTrack gives general estimates to help you build healthy habits. If you have a medical condition, are pregnant, or are under 18, please talk to a doctor or dietitian before changing how you eat.",
  },
];

const PhoneFrame = ({ src, alt, className = "" }: { src: string; alt: string; className?: string }) => (
  <div
    className={`rounded-[2.25rem] border-[6px] border-foreground/90 bg-foreground/90 shadow-2xl overflow-hidden ${className}`}
  >
    <img
      src={src}
      alt={alt}
      width={390}
      height={820}
      className="block w-full h-auto rounded-[1.75rem] bg-background"
    />
  </div>
);

const Index = () => {
  const { session } = useAuth();
  const location = useLocation();
  const primaryLink = session ? "/dashboard" : "/auth?mode=signup";
  const primaryLabel = session ? "Go to my dashboard" : "Get started";

  // Scroll to #features / #how-it-works / #faq when arriving from another page
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView();
  }, [location.hash]);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-nourish-50 to-background overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <p className="inline-block rounded-full bg-nourish-100 px-3 py-1 text-sm font-medium text-nourish-800">
                Nutrition tracking made simple
              </p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-foreground">
                Track your diet, <br className="hidden sm:block" />
                <span className="text-nourish-600">transform your life</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Log your meals in seconds, get a daily calorie target built for your body, and watch your progress
                week by week.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button asChild size="lg" className="gap-2">
                  <Link to={primaryLink}>
                    {primaryLabel}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>
              {!session && <p className="text-sm text-muted-foreground">Set up in under a minute.</p>}
            </div>

            <div className="relative mx-auto w-full max-w-[420px] h-[460px] sm:h-[540px]">
              <div className="absolute inset-x-6 top-10 bottom-0 rounded-full bg-nourish-200/60 blur-3xl" aria-hidden />
              <PhoneFrame
                src="/preview-plan.webp"
                alt="NourishTrack showing a personal daily plan of 2,260 calories"
                className="absolute right-0 top-0 w-[54%] rotate-3"
              />
              <PhoneFrame
                src="/preview-diary.webp"
                alt="NourishTrack food diary with oatmeal, Greek yogurt and jollof rice logged"
                className="absolute left-0 top-12 w-[58%] -rotate-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 md:py-20 bg-background scroll-mt-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Everything you need to eat well</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple tools that fit into your day, not the other way round.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card border rounded-xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-nourish-100 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-nourish-700" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 md:py-20 bg-muted/50 scroll-mt-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">How it works</h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <li key={s.title} className="text-center md:text-left">
                <div className="mx-auto md:mx-0 mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {i + 1}
                </div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-20 bg-background scroll-mt-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-16 bg-nourish-600 text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center space-y-5">
          <h2 className="text-3xl font-bold">Ready to start?</h2>
          <p className="text-nourish-50 max-w-xl mx-auto">
            Get your personal daily plan and log your first meal today.
          </p>
          <Button asChild size="lg" className="bg-white text-nourish-700 hover:bg-nourish-50 gap-2">
            <Link to={primaryLink}>
              {primaryLabel}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
