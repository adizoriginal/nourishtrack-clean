
# System Architecture Documentation

## Overview
NourishTrack follows a modern client-server architecture with a React frontend and Supabase backend.

## Frontend Architecture

### Component Structure
```
Frontend (React/TypeScript)
├── Pages Layer
│   ├── Dashboard
│   ├── FoodDiary
│   ├── Progress
│   ├── Profile
│   └── Auth
├── Component Layer
│   ├── Layout Components
│   ├── Feature Components
│   └── UI Components (shadcn/ui)
├── Context Layer
│   ├── AuthContext
│   └── AppContext
└── Integration Layer
    └── Supabase Client
```

### State Management
- **React Context** for global state (user auth, app data)
- **React Query** for server state and caching
- **Local component state** for UI interactions

### Routing
- **React Router v6** for client-side navigation
- Protected routes for authenticated pages
- Automatic redirects based on auth status

## Backend Architecture

### Supabase Services
```
Supabase Backend
├── Database (PostgreSQL)
│   ├── meal_plans table
│   └── RLS Policies
├── Authentication
│   ├── Email/Password auth
│   └── Session management
└── API Layer
    ├── Auto-generated REST API
    └── Real-time subscriptions
```

### Security Model
- **Row-Level Security (RLS)** ensures data isolation
- **JWT tokens** for authentication
- **Secure API endpoints** with user verification

## Data Flow

### Authentication Flow
1. User signs up/logs in via Supabase Auth
2. JWT token stored in browser
3. Token automatically included in API requests
4. RLS policies verify user access

### Meal Plan Generation Flow
1. User clicks "Generate Plans"
2. Frontend fetches user profile data
3. Algorithm calculates macro requirements
4. Random meals selected from predefined options
5. Meal plans saved to database
6. UI updates with new plans

### Food Diary Flow
1. User adds food item
2. Nutritional data calculated
3. State updated in AppContext
4. Dashboard charts re-render automatically

## Performance Considerations

### Frontend Optimizations
- **Code splitting** with React.lazy()
- **Memoization** for expensive calculations
- **Virtual scrolling** for large lists
- **Image optimization** and lazy loading

### Backend Optimizations
- **Database indexing** on user_id columns
- **Query optimization** with proper joins
- **Caching** via React Query
- **Real-time updates** for live data

## Scalability

### Current Limitations
- Single-region deployment
- Limited to Supabase's scaling limits
- Client-side meal generation

### Scaling Strategies
- **CDN integration** for static assets
- **Database optimization** and connection pooling
- **Microservices** for specific features
- **Caching layers** (Redis) for frequently accessed data
