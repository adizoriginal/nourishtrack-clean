import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { UnitToggle } from "@/components/UnitToggle";
import { UnitSystem, cmToFtIn, displayWeight, ftInToCm, toKg } from "@/lib/units";
import {
  ACTIVITY_LEVELS,
  ActivityLevel,
  LIMITS,
  Sex,
  WEIGHT_GOALS,
  WeightGoal,
  calculateTargets,
} from "@/lib/nutritionTargets";

import { ONBOARDING_SKIP_KEY } from "@/lib/onboarding";

const STEPS = ["About you", "Activity", "Goal", "Your plan"];

const OptionCard = ({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      "w-full text-left rounded-lg border p-4 transition-colors flex items-start justify-between gap-3",
      selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted"
    )}
  >
    <span>
      <span className="block font-medium">{title}</span>
      {description && <span className="block text-sm text-muted-foreground mt-0.5">{description}</span>}
    </span>
    {selected && <Check className="h-5 w-5 text-primary shrink-0" />}
  </button>
);

const Onboarding = () => {
  const navigate = useNavigate();
  const { profile, profileComplete, updateProfile } = useAppContext();

  // Only pre-fill from the profile if the user has filled it in before; otherwise start blank.
  const prefill = profileComplete === true;
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile.name !== "User" ? profile.name : "");
  const [sex, setSex] = useState<Sex | "">(prefill ? (profile.gender as Sex) : "");
  const [age, setAge] = useState(prefill ? String(profile.age) : "");
  const [units, setUnits] = useState<UnitSystem>(profile.units);
  // Height/weight are typed in the chosen units and converted to cm/kg for the maths and saving
  const [height, setHeight] = useState(prefill ? String(profile.height) : "");
  const [heightFt, setHeightFt] = useState(prefill ? String(cmToFtIn(profile.height).ft) : "");
  const [heightIn, setHeightIn] = useState(prefill ? String(cmToFtIn(profile.height).inch) : "");
  const [weight, setWeight] = useState(prefill ? String(displayWeight(profile.weight, profile.units)) : "");
  const [activity, setActivity] = useState<ActivityLevel | "">(
    prefill ? (profile.activityLevel as ActivityLevel) : ""
  );
  const [goal, setGoal] = useState<WeightGoal | "">(prefill ? (profile.weightGoal as WeightGoal) : "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const num = (v: string) => (v.trim() === "" ? NaN : Number(v));
  const inRange = (v: number, r: { min: number; max: number }) => Number.isFinite(v) && v >= r.min && v <= r.max;

  const ageN = num(age);
  const heightN =
    units === "metric"
      ? num(height)
      : heightFt.trim() === ""
        ? NaN
        : ftInToCm(num(heightFt), heightIn.trim() === "" ? 0 : num(heightIn));
  const weightN = weight.trim() === "" ? NaN : toKg(num(weight), units);
  const heightEntered = units === "metric" ? !!height : !!heightFt;

  // Keep what's been typed when switching units. If nothing was changed after switching,
  // switching back restores exactly what was typed (no rounding drift).
  const [beforeSwitch, setBeforeSwitch] = useState<{ units: UnitSystem; weight: string; shown: string } | null>(null);
  const switchUnits = (next: UnitSystem) => {
    if (next === units) return;
    if (Number.isFinite(heightN)) {
      const { ft, inch } = cmToFtIn(heightN);
      setHeight(String(Math.round(heightN)));
      setHeightFt(String(ft));
      setHeightIn(String(inch));
    }
    if (Number.isFinite(weightN)) {
      const restore = beforeSwitch && beforeSwitch.units === next && beforeSwitch.shown === weight;
      const shown = restore ? beforeSwitch.weight : String(displayWeight(weightN, next));
      setBeforeSwitch({ units, weight, shown });
      setWeight(shown);
    }
    setUnits(next);
  };

  const errors = {
    age: age && !inRange(ageN, LIMITS.age) ? `Enter an age between ${LIMITS.age.min} and ${LIMITS.age.max}` : "",
    height:
      heightEntered && !inRange(heightN, LIMITS.heightCm)
        ? units === "metric"
          ? `Enter a height between ${LIMITS.heightCm.min} and ${LIMITS.heightCm.max} cm`
          : "Enter a height between 4 ft 0 in and 7 ft 6 in"
        : "",
    weight:
      weight && !inRange(weightN, LIMITS.weightKg)
        ? units === "metric"
          ? `Enter a weight between ${LIMITS.weightKg.min} and ${LIMITS.weightKg.max} kg`
          : "Enter a weight between 66 and 660 lb"
        : "",
  };

  const stepValid = [
    !!sex && inRange(ageN, LIMITS.age) && inRange(heightN, LIMITS.heightCm) && inRange(weightN, LIMITS.weightKg),
    !!activity,
    !!goal,
    true,
  ][step];

  const targets = useMemo(() => {
    if (!sex || !activity || !goal || !inRange(ageN, LIMITS.age)) return null;
    return calculateTargets({
      sex,
      age: ageN,
      heightCm: heightN,
      weightKg: weightN,
      activityLevel: activity,
      weightGoal: goal,
    });
  }, [sex, activity, goal, ageN, heightN, weightN]);

  const skip = () => {
    try {
      sessionStorage.setItem(ONBOARDING_SKIP_KEY, "1");
    } catch {
      /* storage unavailable: skipping still works for this page view */
    }
    navigate("/dashboard");
  };

  const finish = async () => {
    if (!targets || !sex || !activity || !goal) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateProfile(
        {
          ...(name.trim() ? { name: name.trim() } : {}),
          gender: sex,
          age: Math.round(ageN),
          height: Math.round(heightN),
          weight: Math.round(weightN * 100) / 100,
          units,
          activityLevel: activity,
          weightGoal: goal,
          calorieGoal: targets.calorieGoal,
          proteinGoal: targets.proteinGoal,
          carbsGoal: targets.carbsGoal,
          fatGoal: targets.fatGoal,
        },
        { silent: true }
      );
      navigate("/food-diary");
    } catch {
      setSaveError("We couldn't save your plan. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </span>
          {step < 3 && (
            <button type="button" onClick={skip} className="underline-offset-4 hover:underline">
              Skip for now
            </button>
          )}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} aria-label="Setup progress" className="h-2 bg-muted" />
      </div>

      <Card>
        {step === 0 && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Let's set up your plan</CardTitle>
              <CardDescription>
                We'll use this to work out how much you should eat each day. Takes under a minute.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="ob-name">What should we call you? (optional)</Label>
                <Input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" />
              </div>
              <div className="space-y-2">
                <Label>Sex</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "other", label: "Prefer not to say" },
                  ] as { value: Sex; label: string }[]).map((o) => (
                    <Button
                      key={o.value}
                      type="button"
                      variant="outline"
                      onClick={() => setSex(o.value)}
                      aria-pressed={sex === o.value}
                      className={cn(
                        "h-auto min-h-10 py-2 whitespace-normal leading-tight",
                        sex === o.value && "border-primary bg-primary/10 text-primary ring-1 ring-primary hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      {o.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Used only to estimate your energy needs.</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">Your measurements</span>
                <UnitToggle value={units} onChange={switchUnits} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ob-age">Age</Label>
                  <Input id="ob-age" type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="25" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-weight">Weight ({units === "metric" ? "kg" : "lb"})</Label>
                  <Input id="ob-weight" type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder={units === "metric" ? "70" : "155"} />
                </div>
                {units === "metric" ? (
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="ob-height">Height (cm)</Label>
                    <Input id="ob-height" type="number" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
                  </div>
                ) : (
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label htmlFor="ob-height-ft">Height</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input id="ob-height-ft" aria-label="Height, feet" type="number" inputMode="numeric" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} placeholder="5" className="pr-7" />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ft</span>
                      </div>
                      <div className="relative flex-1">
                        <Input id="ob-height-in" aria-label="Height, inches" type="number" inputMode="numeric" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} placeholder="7" className="pr-7" />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">in</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {(errors.age || errors.height || errors.weight) && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.age || errors.height || errors.weight}
                </p>
              )}
            </CardContent>
          </>
        )}

        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">How active are you?</CardTitle>
              <CardDescription>Think about a normal week, including work and exercise.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {ACTIVITY_LEVELS.map((a) => (
                <OptionCard
                  key={a.value}
                  selected={activity === a.value}
                  onClick={() => setActivity(a.value)}
                  title={a.label}
                  description={a.description}
                />
              ))}
            </CardContent>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">What's your goal?</CardTitle>
              <CardDescription>You can change this any time in your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {WEIGHT_GOALS.map((g) => (
                <OptionCard
                  key={g.value}
                  selected={goal === g.value}
                  onClick={() => setGoal(g.value)}
                  title={g.label}
                  description={
                    units === "imperial"
                      ? g.description.replace("0.5 kg", "1 lb").replace("0.25 kg", "0.5 lb")
                      : g.description
                  }
                />
              ))}
            </CardContent>
          </>
        )}

        {step === 3 && targets && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">{name.trim() ? `${name.trim()}, here's` : "Here's"} your daily plan</CardTitle>
              <CardDescription>Based on your details. Adjust it any time in your profile.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl bg-primary/10 p-6 text-center">
                <div className="text-sm font-medium text-muted-foreground">Daily calorie target</div>
                <div className="text-5xl font-bold text-primary mt-1">{targets.calorieGoal.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">kcal per day</div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Protein", value: targets.proteinGoal },
                  { label: "Carbs", value: targets.carbsGoal },
                  { label: "Fat", value: targets.fatGoal },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg border p-3">
                    <div className="text-xl font-semibold">{m.value}g</div>
                    <div className="text-xs text-muted-foreground">{m.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Your body uses about <strong>{targets.maintenanceCalories.toLocaleString()} kcal</strong> a day.
                {goal === "lose" && !targets.adjusted && " Eating 500 less than that should mean steady, healthy weight loss."}
                {goal === "gain" && " Eating a little more than that supports gradual weight gain."}
                {goal === "maintain" && " Eating around that amount keeps your weight steady."}
              </p>
              {targets.adjusted && (
                <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {ageN < 18
                      ? "Because you're under 18, we haven't cut your calories. Your body still needs plenty of energy to grow. Talk to a doctor before trying to lose weight."
                      : "We've kept your target at a safe minimum. For bigger changes, it's best to talk to a doctor or dietitian."}
                  </span>
                </div>
              )}
              {saveError && (
                <p className="text-sm text-destructive" role="alert">
                  {saveError}
                </p>
              )}
            </CardContent>
          </>
        )}

        <div className="flex justify-between gap-3 p-6 pt-0">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={saving}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!stepValid}>
              {step === 2 ? "See my plan" : "Next"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={finish} disabled={saving || !targets}>
              {saving ? "Saving..." : "Start logging food"}
              {!saving && <ArrowRight className="h-4 w-4 ml-1" />}
            </Button>
          )}
        </div>
      </Card>

      <p className="text-xs text-muted-foreground text-center mt-4">
        These targets are general estimates, not medical advice.
      </p>
    </div>
  );
};

export default Onboarding;
