import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mealType, count = 3, userId } = await req.json();
    
    console.log('Generating personalized meals for user:', userId, 'meal type:', mealType);

    const spoonacularApiKey = Deno.env.get('SPOONACULAR_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!spoonacularApiKey) {
      console.error('SPOONACULAR_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'SPOONACULAR_API_KEY not configured',
          details: 'API key is missing'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(
        JSON.stringify({ 
          error: 'Supabase configuration missing',
          details: 'Database connection failed'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user profile for personalized nutrition goals
    let userProfile = null;
    if (userId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.log('Could not fetch user profile, using defaults:', profileError.message);
      } else {
        userProfile = profile;
        console.log('User profile loaded:', userProfile);
      }
    }

    // Calculate personalized nutrition targets
    const nutritionTargets = calculateNutritionTargets(userProfile, mealType);
    console.log('Calculated nutrition targets:', nutritionTargets);

    // Parse dietary preferences
    const dietaryPreferences = userProfile?.dietary_preferences ? 
      JSON.parse(userProfile.dietary_preferences) : [];
    console.log('User dietary preferences:', dietaryPreferences);

    const meals = [];

    // Generate the requested number of meals for the specific meal type
    for (let i = 0; i < count; i++) {
      console.log(`Generating personalized ${mealType} meal ${i + 1}...`);
      
      try {
        // Build personalized search parameters
        const searchParams = new URLSearchParams({
          apiKey: spoonacularApiKey,
          type: mealType === 'snacks' ? 'snack' : mealType,
          number: '1',
          addRecipeInformation: 'true',
          fillIngredients: 'true',
          sort: 'random'
        });

        // Add dietary preferences
        if (dietaryPreferences.length > 0) {
          // Map our preferences to Spoonacular diet parameter
          const spoonacularDiets = {
            'vegetarian': 'vegetarian',
            'vegan': 'vegan',
            'ketogenic': 'ketogenic',
            'paleo': 'paleo',
            'diabetic': '', // Handle diabetic separately with glycemic index
          };

          const spoonacularIntolerances = {
            'gluten-free': 'gluten',
            'dairy-free': 'dairy',
            'low-sodium': '', // Handle with maxSodium parameter
          };

          // Set diet parameter
          const applicableDiets = dietaryPreferences
            .map(pref => spoonacularDiets[pref])
            .filter(Boolean);
          
          if (applicableDiets.length > 0) {
            searchParams.append('diet', applicableDiets[0]); // Spoonacular accepts one diet
          }

          // Set intolerances parameter
          const applicableIntolerances = dietaryPreferences
            .map(pref => spoonacularIntolerances[pref])
            .filter(Boolean);
          
          if (applicableIntolerances.length > 0) {
            searchParams.append('intolerances', applicableIntolerances.join(','));
          }

          // Handle special dietary needs
          if (dietaryPreferences.includes('diabetic')) {
            searchParams.append('maxSugar', '10'); // Low sugar for diabetics
            searchParams.append('minFiber', '5'); // High fiber for diabetics
          }

          if (dietaryPreferences.includes('low-sodium')) {
            searchParams.append('maxSodium', '1500'); // Low sodium
          }

          console.log('Applied dietary preferences to search:', {
            diets: applicableDiets,
            intolerances: applicableIntolerances
          });
        }

        // Add personalized nutrition constraints
        if (nutritionTargets.minCalories) {
          searchParams.append('minCalories', nutritionTargets.minCalories.toString());
        }
        if (nutritionTargets.maxCalories) {
          searchParams.append('maxCalories', nutritionTargets.maxCalories.toString());
        }
        if (nutritionTargets.minProtein) {
          searchParams.append('minProtein', nutritionTargets.minProtein.toString());
        }
        if (nutritionTargets.maxProtein) {
          searchParams.append('maxProtein', nutritionTargets.maxProtein.toString());
        }
        if (nutritionTargets.minCarbs) {
          searchParams.append('minCarbs', nutritionTargets.minCarbs.toString());
        }
        if (nutritionTargets.maxCarbs) {
          searchParams.append('maxCarbs', nutritionTargets.maxCarbs.toString());
        }
        if (nutritionTargets.minFat) {
          searchParams.append('minFat', nutritionTargets.minFat.toString());
        }
        if (nutritionTargets.maxFat) {
          searchParams.append('maxFat', nutritionTargets.maxFat.toString());
        }

        const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?${searchParams}`;
        console.log('Searching for personalized recipes with dietary preferences:', searchUrl);
        
        const searchResponse = await fetch(searchUrl);
        
        if (!searchResponse.ok) {
          console.error(`Spoonacular search API error: ${searchResponse.status} - ${searchResponse.statusText}`);
          const errorText = await searchResponse.text();
          console.error('Spoonacular error response:', errorText);
          continue; // Skip this meal and try the next one
        }

        const searchData = await searchResponse.json();
        
        if (!searchData.results || searchData.results.length === 0) {
          console.log(`No recipes found for ${mealType} with personalized criteria, trying with relaxed constraints...`);
          
          // Fallback: try with just calorie constraints and dietary preferences
          const fallbackParams = new URLSearchParams({
            apiKey: spoonacularApiKey,
            type: mealType === 'snacks' ? 'snack' : mealType,
            number: '1',
            addRecipeInformation: 'true',
            fillIngredients: 'true',
            sort: 'random'
          });
          
          // Keep dietary preferences in fallback
          if (dietaryPreferences.length > 0) {
            const applicableDiets = dietaryPreferences
              .map(pref => ({'vegetarian': 'vegetarian', 'vegan': 'vegan', 'ketogenic': 'ketogenic', 'paleo': 'paleo'})[pref])
              .filter(Boolean);
            
            if (applicableDiets.length > 0) {
              fallbackParams.append('diet', applicableDiets[0]);
            }
          }
          
          if (nutritionTargets.maxCalories) {
            fallbackParams.append('maxCalories', nutritionTargets.maxCalories.toString());
          }
          
          const fallbackUrl = `https://api.spoonacular.com/recipes/complexSearch?${fallbackParams}`;
          console.log('Trying fallback search with dietary preferences:', fallbackUrl);
          
          const fallbackResponse = await fetch(fallbackUrl);
          if (!fallbackResponse.ok) {
            console.error(`Fallback search also failed: ${fallbackResponse.status}`);
            continue;
          }
          
          const fallbackData = await fallbackResponse.json();
          if (!fallbackData.results || fallbackData.results.length === 0) {
            console.log('Even fallback search returned no results');
            continue;
          }
          
          searchData.results = fallbackData.results;
        }

        const recipe = searchData.results[0];
        console.log(`Found personalized recipe for ${mealType}:`, recipe.title);

        // Second API call: Get detailed recipe information with instructions
        const detailUrl = `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${spoonacularApiKey}&includeNutrition=true`;
        console.log('Fetching recipe details with URL:', detailUrl);
        
        const detailResponse = await fetch(detailUrl);
        
        if (!detailResponse.ok) {
          console.error(`Spoonacular detail API error: ${detailResponse.status} - ${detailResponse.statusText}`);
          const detailErrorText = await detailResponse.text();
          console.error('Detail API error response:', detailErrorText);
          continue; // Skip this meal and try the next one
        }

        const detailData = await detailResponse.json();
        console.log(`Got detailed personalized recipe for ${mealType}:`, detailData.title);

        // Extract nutrition information
        const nutrition = detailData.nutrition?.nutrients || [];
        const calories = nutrition.find(n => n.name === 'Calories')?.amount || nutritionTargets.targetCalories;
        const protein = nutrition.find(n => n.name === 'Protein')?.amount || nutritionTargets.targetProtein;
        const carbs = nutrition.find(n => n.name === 'Carbohydrates')?.amount || nutritionTargets.targetCarbs;
        const fat = nutrition.find(n => n.name === 'Fat')?.amount || nutritionTargets.targetFat;

        // Extract ingredients with measurements
        const ingredients = detailData.extendedIngredients?.map(ing => ing.original) || [];
        
        // Extract cooking instructions
        const instructions = detailData.analyzedInstructions?.[0]?.steps?.map(step => step.step) || 
                            detailData.instructions?.split(/\d+\./).filter(step => step.trim()) || 
                            ['Follow the recipe instructions'];

        const meal = {
          id: `spoonacular-${detailData.id}-${Date.now()}`,
          name: detailData.title,
          description: detailData.summary?.replace(/<[^>]*>/g, '').substring(0, 200) + '...' || `Personalized ${mealType} recipe`,
          meal_type: mealType,
          calories: Math.round(calories),
          protein: Math.round(protein),
          carbs: Math.round(carbs),
          fats: Math.round(fat),
          ingredients: ingredients,
          instructions: instructions,
          readyInMinutes: detailData.readyInMinutes || 30,
          servings: detailData.servings || 2,
          sourceUrl: detailData.sourceUrl || detailData.spoonacularSourceUrl,
          nutritionTargets: nutritionTargets,
          dietaryPreferences: dietaryPreferences // Include in response for debugging
        };

        meals.push(meal);
      } catch (mealError) {
        console.error(`Error generating meal ${i + 1}:`, mealError);
        continue; // Continue with next meal
      }
    }

    if (meals.length === 0) {
      console.error(`No personalized meals could be generated for ${mealType}`);
      return new Response(
        JSON.stringify({ 
          error: `No meals could be generated for ${mealType}`,
          details: 'All recipe searches failed. This might be due to API limits or overly restrictive nutrition constraints.'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      );
    }

    console.log('Successfully generated personalized meals with dietary preferences:', meals.length);

    return new Response(
      JSON.stringify({ meals }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in generate-meals function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        details: 'Failed to generate personalized meal recommendations'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Function to calculate personalized nutrition targets based on user profile
function calculateNutritionTargets(userProfile: any, mealType: string) {
  // Default fallback values (current behavior)
  let defaultCalories = 400;
  switch (mealType) {
    case 'breakfast':
      defaultCalories = 400;
      break;
    case 'lunch':
      defaultCalories = 500;
      break;
    case 'dinner':
      defaultCalories = 600;
      break;
    case 'snacks':
      defaultCalories = 200;
      break;
  }

  // If no user profile, return defaults
  if (!userProfile) {
    return {
      targetCalories: defaultCalories,
      minCalories: Math.round(defaultCalories * 0.8),
      maxCalories: Math.round(defaultCalories * 1.2),
      targetProtein: 20,
      minProtein: 15,
      maxProtein: 35,
      targetCarbs: 30,
      minCarbs: 20,
      maxCarbs: 50,
      targetFat: 15,
      minFat: 10,
      maxFat: 25
    };
  }

  // Get user's daily goals
  const dailyCalorieGoal = userProfile.calorie_goal || 2000;
  const dailyProteinGoal = userProfile.protein_goal || 150;
  const dailyCarbsGoal = userProfile.carbs_goal || 200;
  const dailyFatGoal = userProfile.fat_goal || 65;
  const weightGoal = userProfile.weight_goal || 'maintain';

  // Adjust calories based on weight goal
  let adjustedCalorieGoal = dailyCalorieGoal;
  switch (weightGoal) {
    case 'lose weight':
      adjustedCalorieGoal = Math.round(dailyCalorieGoal * 0.85); // 15% deficit
      break;
    case 'gain weight':
      adjustedCalorieGoal = Math.round(dailyCalorieGoal * 1.15); // 15% surplus
      break;
    case 'maintain':
    default:
      adjustedCalorieGoal = dailyCalorieGoal;
      break;
  }

  // Distribute daily goals across meals
  let mealCaloriePercentage = 0.25; // 25% for breakfast
  switch (mealType) {
    case 'breakfast':
      mealCaloriePercentage = 0.25;
      break;
    case 'lunch':
      mealCaloriePercentage = 0.35;
      break;
    case 'dinner':
      mealCaloriePercentage = 0.35;
      break;
    case 'snacks':
      mealCaloriePercentage = 0.05;
      break;
  }

  const targetCalories = Math.round(adjustedCalorieGoal * mealCaloriePercentage);
  const targetProtein = Math.round(dailyProteinGoal * mealCaloriePercentage);
  const targetCarbs = Math.round(dailyCarbsGoal * mealCaloriePercentage);
  const targetFat = Math.round(dailyFatGoal * mealCaloriePercentage);

  return {
    targetCalories,
    minCalories: Math.round(targetCalories * 0.8),
    maxCalories: Math.round(targetCalories * 1.2),
    targetProtein,
    minProtein: Math.round(targetProtein * 0.7),
    maxProtein: Math.round(targetProtein * 1.3),
    targetCarbs,
    minCarbs: Math.round(targetCarbs * 0.7),
    maxCarbs: Math.round(targetCarbs * 1.3),
    targetFat,
    minFat: Math.round(targetFat * 0.7),
    maxFat: Math.round(targetFat * 1.3)
  };
}
