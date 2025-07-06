
# Component Documentation

## Component Architecture

NourishTrack follows a hierarchical component structure with clear separation of concerns.

## Page Components

### Dashboard (`src/pages/Dashboard.tsx`)
Main dashboard displaying nutrition summaries and charts.

**Dependencies:**
- `DashboardSummary` - Calorie and macro summary cards
- `NutrientChart` - Pie chart showing macro distribution
- `WeightChart` - Line chart for weight tracking
- `DailySummary` - Daily meal overview

**Props:** None (uses context data)

### FoodDiary (`src/pages/FoodDiary.tsx`)
Food logging interface for tracking daily meals.

**Dependencies:**
- `FoodDiary` component - Main diary interface
- `AddFoodModal` - Modal for adding new food items

**State:**
- `isAddFoodModalOpen` - Controls modal visibility
- `currentMealType` - Tracks which meal is being edited

### Profile (`src/pages/Profile.tsx`)
User profile management and meal plan generation.

**Dependencies:**
- `ProfileCard` - User settings and preferences
- `MealPlanList` - Generated meal plan display

**Auth:** Requires authentication, redirects to login if not signed in

## Feature Components

### MealPlanList (`src/components/profile/MealPlanList.tsx`)
**Purpose:** Displays and generates personalized meal plans

**Key Features:**
- Meal plan generation based on user goals
- Random meal selection from extensive database
- Macro calculation (protein, carbs, fats)
- Regeneration capability for variety

**State Management:**
- `mealPlans` - Array of user meal plans
- `loading` - Loading state for data fetching
- `generating` - Loading state for plan generation

**Meal Databases:**
- `breakfastOptions` - 15 breakfast meal options
- `lunchOptions` - 17 lunch meal options  
- `dinnerOptions` - 20 dinner meal options

**Key Methods:**
- `generateMealPlans()` - Creates new personalized meal plans
- `fetchMealPlans()` - Retrieves existing plans from database
- `getRandomItem()` - Selects random meals for variety

### ProfileCard (`src/components/profile/ProfileCard.tsx`)
**Purpose:** User profile settings and goal management

**Features:**
- Personal information editing
- Nutrition goal setting
- Profile data persistence

## Layout Components

### Header (`src/components/layout/Header.tsx`)
**Purpose:** Main navigation and user authentication status

**Features:**
- Navigation menu
- Authentication state display
- Responsive design

### Footer (`src/components/layout/Footer.tsx`)
**Purpose:** Footer information and links

## Dashboard Components

### DashboardSummary (`src/components/dashboard/DashboardSummary.tsx`)
**Purpose:** Overview cards showing nutrition progress

**Displays:**
- Daily calorie progress
- Macro nutrient tracking
- Goal achievement status

### NutrientChart (`src/components/dashboard/NutrientChart.tsx`)
**Purpose:** Visual representation of macro distribution

**Technology:** Recharts pie chart
**Data:** Protein, carbs, and fat calories

### WeightChart (`src/components/dashboard/WeightChart.tsx`)
**Purpose:** Weight tracking over time

**Technology:** Recharts line chart
**Data:** Historical weight data

### DailySummary (`src/components/dashboard/DailySummary.tsx`)
**Purpose:** Daily meal overview and summary

## Food Components

### FoodDiary (`src/components/food/FoodDiary.tsx`)
**Purpose:** Main food logging interface

**Features:**
- Meal categorization (breakfast, lunch, dinner, snacks)
- Food item management
- Nutritional calculations

### AddFoodModal (`src/components/food/AddFoodModal.tsx`)
**Purpose:** Modal for adding food items

**Features:**
- Food search and selection
- Portion size adjustment
- Nutritional information display

### MealCard (`src/components/food/MealCard.tsx`)
**Purpose:** Individual meal display and editing

## Context Providers

### AuthContext (`src/contexts/AuthContext.tsx`)
**Purpose:** Authentication state management

**Provides:**
- `session` - Current user session
- `user` - Authenticated user object

**Features:**
- Automatic session persistence
- Auth state listening
- Session refresh handling

### AppContext (`src/contexts/AppContext.tsx`)
**Purpose:** Application data and state management

**Provides:**
- User profile data
- Meal tracking
- Weight history
- Nutrition calculations

## UI Components (shadcn/ui)

### Button (`src/components/ui/button.tsx`)
**Variants:** default, destructive, outline, secondary, ghost, link
**Sizes:** default, sm, lg, icon

### Card (`src/components/ui/card.tsx`)
**Components:** Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter

### Input (`src/components/ui/input.tsx`)
**Purpose:** Form input fields with consistent styling

### Toast (`src/components/ui/toast.tsx`)
**Purpose:** Notification system for user feedback

## Component Best Practices

### State Management
- Use React Context for global state
- Local state for component-specific data
- React Query for server state

### Error Handling
- Display user-friendly error messages
- Use toast notifications for feedback
- Graceful fallbacks for loading states

### Performance
- Memoize expensive calculations
- Use React.memo for pure components
- Implement proper dependency arrays in useEffect

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
