
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mealName } = await req.json();
    
    if (!mealName) {
      throw new Error('Meal name is required');
    }

    const spoonacularApiKey = Deno.env.get('SPOONACULAR_API_KEY');
    
    if (!spoonacularApiKey) {
      console.log('SPOONACULAR_API_KEY not configured, returning fallback data');
      
      // Return fallback recipe data
      return new Response(
        JSON.stringify({
          ingredients: [
            "Fresh ingredients as needed for " + mealName,
            "Seasonings and herbs to taste",
            "Cooking oil or butter as needed",
            "Salt and pepper to taste"
          ],
          instructions: [
            `Gather all ingredients needed for ${mealName}`,
            "Prepare ingredients according to recipe requirements",
            "Cook using your preferred method and technique",
            "Season and adjust flavors to your preference",
            "Serve hot and enjoy your meal!"
          ],
          readyInMinutes: 30,
          servings: 2
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Search for the recipe
    const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${spoonacularApiKey}&query=${encodeURIComponent(mealName)}&number=1&addRecipeInformation=true`;
    
    console.log('Searching for recipe:', mealName);
    
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      throw new Error(`Spoonacular API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.results || searchData.results.length === 0) {
      // Return fallback data if no recipe found
      return new Response(
        JSON.stringify({
          ingredients: [
            "Main ingredients for " + mealName,
            "Supporting seasonings and spices",
            "Cooking oil or fat as needed",
            "Fresh herbs for garnish"
          ],
          instructions: [
            `Prepare the main components for ${mealName}`,
            "Cook according to standard preparation methods",
            "Season and adjust flavors throughout cooking",
            "Plate and serve when ready"
          ],
          readyInMinutes: 25,
          servings: 2
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const recipe = searchData.results[0];
    
    // Extract ingredients and instructions
    const ingredients = recipe.extendedIngredients?.map((ing: any) => ing.original) || [
      "Ingredients not available - please refer to recipe source"
    ];
    
    const instructions = recipe.analyzedInstructions?.[0]?.steps?.map((step: any) => step.step) || [
      `Follow standard preparation method for ${mealName}`,
      "Cook according to your preferences",
      "Season to taste and serve"
    ];

    const recipeDetails = {
      ingredients,
      instructions,
      readyInMinutes: recipe.readyInMinutes || 30,
      servings: recipe.servings || 2
    };

    console.log('Recipe details found:', recipeDetails);

    return new Response(
      JSON.stringify(recipeDetails),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in get-meal-details function:', error);
    
    // Return fallback data on error
    return new Response(
      JSON.stringify({
        ingredients: [
          "Fresh ingredients as needed",
          "Seasonings and spices to taste",
          "Cooking oil or butter",
          "Additional herbs as desired"
        ],
        instructions: [
          "Prepare all ingredients",
          "Cook using preferred method",
          "Season and adjust flavors",
          "Serve hot and enjoy!"
        ],
        readyInMinutes: 30,
        servings: 2
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
