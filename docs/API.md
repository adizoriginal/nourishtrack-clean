
# API Documentation

## Supabase Integration

NourishTrack uses Supabase's auto-generated REST API and real-time capabilities.

### Authentication API

#### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});
```

#### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

#### Sign Out
```typescript
const { error } = await supabase.auth.signOut();
```

### Database Operations

#### Meal Plans

##### Fetch User Meal Plans
```typescript
const { data, error } = await supabase
  .rpc('get_meal_plans');
```

##### Create Meal Plan
```typescript
const { data, error } = await supabase
  .from('meal_plans')
  .insert({
    user_id: user.id,
    name: 'Breakfast Bowl',
    description: 'Healthy morning meal',
    meal_type: 'breakfast',
    calories: 350,
    protein: 20,
    carbs: 45,
    fats: 12
  });
```

##### Delete Meal Plans
```typescript
const { error } = await supabase
  .from('meal_plans')
  .delete()
  .eq('user_id', user.id);
```

### Database Functions

#### get_meal_plans()
Returns meal plans for the authenticated user.

**Returns:** `SETOF json`
**Security:** Uses RLS to filter by `auth.uid()`

```sql
CREATE OR REPLACE FUNCTION public.get_meal_plans()
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'id', mp.id,
    'name', mp.name,
    'description', mp.description,
    'meal_type', mp.meal_type,
    'calories', mp.calories,
    'protein', mp.protein,
    'carbs', mp.carbs,
    'fats', mp.fats
  )
  FROM public.meal_plans mp
  WHERE mp.user_id = auth.uid();
END;
$function$
```

### Error Handling

#### Common Error Patterns
```typescript
try {
  const { data, error } = await supabase
    .from('meal_plans')
    .select('*');
    
  if (error) throw error;
  
  // Handle success
} catch (error: any) {
  console.error('Database error:', error.message);
  toast({
    variant: "destructive",
    title: "Error",
    description: error.message,
  });
}
```

### Real-time Subscriptions

#### Listen to Meal Plan Changes
```typescript
useEffect(() => {
  const channel = supabase
    .channel('meal-plans-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meal_plans',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        // Handle real-time updates
        fetchMealPlans();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user]);
```

## Client Configuration

### Supabase Client Setup
```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fgmibebjtylyhzqgczfc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
```

### Query Client Setup
```typescript
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKey: ['todos'],
      queryFn: fetchTodos,
    },
  },
});
```
