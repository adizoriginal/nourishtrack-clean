
# NourishTrack - Nutrition Tracking Web Application

## Project Overview

NourishTrack is a comprehensive nutrition tracking web application built with React, TypeScript, and Supabase. It helps users monitor their daily food intake, track nutritional goals, and generate personalized meal plans.

## Key Features

### 🍽️ Food Diary
- Track meals throughout the day (breakfast, lunch, dinner, snacks)
- Add food items with detailed nutritional information
- Real-time calorie and macro tracking
- Daily nutrition summary

### 📊 Progress Tracking
- Visual charts showing nutrition trends
- Weight tracking with historical data
- Goal progress indicators
- Macro distribution pie charts

### 🥗 Meal Planning
- AI-generated personalized meal plans
- Based on user's calorie and macro goals
- Extensive meal database with 60+ options
- Regenerate plans for variety

### 👤 User Profile Management
- Customizable nutrition goals
- Personal information tracking
- Secure authentication with Supabase

## Technology Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Premium UI components
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Recharts** - Data visualization

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication system
  - Row-Level Security (RLS)
  - Real-time subscriptions

## Architecture

```
src/
├── components/          # Reusable UI components
│   ├── dashboard/       # Dashboard-specific components
│   ├── food/           # Food diary components
│   ├── layout/         # Layout components (Header, Footer)
│   ├── profile/        # User profile components
│   └── ui/             # shadcn/ui components
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── lib/                # Utility functions
└── pages/              # Main application pages
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Database Schema

### Tables
- `meal_plans` - User meal plan data
- User authentication handled by Supabase Auth

### Security
- Row-Level Security (RLS) policies ensure users only access their own data
- Secure authentication with email/password

## Key Components

### Dashboard
- Real-time nutrition summaries
- Interactive charts and graphs
- Daily calorie tracking

### Food Diary
- Meal logging interface
- Nutritional information display
- Add/remove food items

### Profile Management
- User settings and preferences
- Goal configuration
- Meal plan generation

## Future Enhancements
- Mobile application
- Social features and sharing
- AI-powered nutrition recommendations
- Integration with fitness trackers
- Barcode scanning for food items
