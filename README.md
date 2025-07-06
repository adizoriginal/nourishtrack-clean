
# NourishTrack - Nutrition and Wellness Hub

A comprehensive nutrition tracking application built with React, TypeScript, and Supabase.

## Features

- **Food Diary**: Track your daily meals and nutrition intake
- **Personalized Meal Recommendations**: AI-powered meal suggestions based on your dietary preferences and goals
- **Progress Tracking**: Monitor your weight and nutrition goals over time
- **Dietary Preferences**: Support for vegetarian, vegan, ketogenic, diabetic, and other dietary restrictions
- **User Profiles**: Customize your nutrition goals and personal information

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Edge Functions)
- **APIs**: Spoonacular API for meal recommendations
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd nourishtrack
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Create a Supabase project
   - Get a Spoonacular API key
   - Configure your Supabase settings

4. Run the development server:
```bash
npm run dev
```

## Database Schema

The application uses several Supabase tables:
- `profiles` - User profile information and dietary preferences  
- `food_entries` - Daily food intake records
- `meal_plans` - Saved meal plans
- `weight_entries` - Weight tracking data

## API Integration

The app integrates with the Spoonacular API to provide:
- Recipe search with dietary filters
- Nutrition information
- Personalized meal recommendations based on user preferences

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License.
