
# Database Schema Documentation

## Overview
NourishTrack uses PostgreSQL through Supabase with Row-Level Security (RLS) for data protection.

## Tables

### meal_plans
Stores user-generated meal plans with nutritional information.

#### Schema
```sql
CREATE TABLE public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  meal_type TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein DOUBLE PRECISION NOT NULL,
  carbs DOUBLE PRECISION NOT NULL,
  fats DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### Columns
- `id` - Unique identifier (UUID, auto-generated)
- `user_id` - Reference to authenticated user
- `name` - Meal plan name
- `description` - Optional meal description
- `meal_type` - Type of meal (breakfast, lunch, dinner)
- `calories` - Total calories for the meal
- `protein` - Protein content in grams
- `carbs` - Carbohydrate content in grams
- `fats` - Fat content in grams
- `created_at` - Timestamp of creation
- `updated_at` - Timestamp of last update

#### Indexes
- Primary key on `id`
- Index on `user_id` for query performance

### Authentication Tables
Managed by Supabase Auth service:
- `auth.users` - User account information
- `auth.sessions` - Active user sessions

## Security

### Row-Level Security (RLS)
Currently, the meal_plans table has RLS enabled but no explicit policies are defined. The security is handled through the `get_meal_plans()` function which filters by `auth.uid()`.

#### Recommended RLS Policies
```sql
-- Enable RLS
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Policy for SELECT operations
CREATE POLICY "Users can view their own meal plans" 
ON public.meal_plans 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for INSERT operations
CREATE POLICY "Users can create their own meal plans" 
ON public.meal_plans 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy for UPDATE operations
CREATE POLICY "Users can update their own meal plans" 
ON public.meal_plans 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy for DELETE operations
CREATE POLICY "Users can delete their own meal plans" 
ON public.meal_plans 
FOR DELETE 
USING (auth.uid() = user_id);
```

## Database Functions

### get_meal_plans()
Retrieves meal plans for the authenticated user.

**Purpose:** Secure data retrieval with user filtering
**Security:** SECURITY DEFINER with auth.uid() filtering
**Returns:** JSON objects with meal plan data

## Data Relationships

```
auth.users (Supabase managed)
    ↓ (user_id reference)
meal_plans
```

## Query Patterns

### Common Queries

#### Fetch User Meal Plans
```sql
SELECT * FROM meal_plans WHERE user_id = auth.uid();
```

#### Insert New Meal Plan
```sql
INSERT INTO meal_plans (user_id, name, description, meal_type, calories, protein, carbs, fats)
VALUES (auth.uid(), 'Protein Bowl', 'High protein breakfast', 'breakfast', 400, 30, 20, 15);
```

#### Delete All User Meal Plans
```sql
DELETE FROM meal_plans WHERE user_id = auth.uid();
```

## Performance Considerations

### Indexing Strategy
- Primary key index on `id` (automatic)
- Consider adding index on `user_id` for faster user-specific queries
- Consider composite index on `(user_id, meal_type)` for meal type filtering

### Query Optimization
- Use the `get_meal_plans()` function for consistent performance
- Batch operations when possible
- Limit result sets with pagination for large datasets

## Backup and Migration

### Data Export
```sql
COPY meal_plans TO '/path/to/backup.csv' DELIMITER ',' CSV HEADER;
```

### Migration Considerations
- Always test migrations on development data first
- Use transactions for multi-step migrations
- Consider data validation after migrations
