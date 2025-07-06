
# Deployment Guide

## Overview
NourishTrack is deployed using a modern development workflow with VS Code and Supabase as the backend service.
## Deployment Architecture

```
User Request
    ↓
CDN (Static Assets)
    ↓
React Application
    ↓
Supabase Backend
    ↓
PostgreSQL Database
```

## Frontend Deployment

### Deployment Method
The application is built and deployed manually using a standard Vite workflow:
1. **Build Locally:** Code changes are built with `npm run build`  
2. **Static Optimization:** Vite handles asset optimization  
3. **CDN Hosting:** Static files are hosted via a CDN (e.g., Vercel, Netlify, or other static hosts)  


### Build Process
```bash
# Production build
npm run build

# Preview build locally
npm run preview
```

### Build Configuration
**Vite Configuration (`vite.config.ts`):**
- TypeScript compilation
- Asset optimization
- Environment variable handling
- Path aliasing (@/ for src/)

## Backend Deployment

### Supabase Infrastructure
- **Database:** Managed PostgreSQL instance
- **Authentication:** Built-in auth service
- **API:** Auto-generated REST endpoints
- **Real-time:** WebSocket connections for live updates

### Environment Variables
```typescript
// Supabase Configuration
SUPABASE_URL: "https://fgmibebjtylyhzqgczfc.supabase.co"
SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Database Deployment

### Migration Strategy
1. **Schema Changes:** Applied through Supabase dashboard
2. **Data Migration:** Handled via SQL scripts
3. **Rollback Plan:** Database backups for recovery

### Production Database Setup
```sql
-- Enable Row Level Security
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
```

## Security Configuration

### CORS Settings
Configured in Supabase for frontend domain access

### API Security
- JWT token validation
- Row-Level Security policies
- Rate limiting (Supabase managed)

### Environment Security
- API keys stored securely in environment variables (.env files not committed to version control)
-No sensitive data exposed in client-side code
-HTTPS enforced by hosting provider

## Performance Optimization

### Frontend Optimizations
- **Code Splitting:** Automatic route-based splitting
- **Asset Compression:** Gzip/Brotli compression
- **Caching:** Browser and CDN caching strategies
- **Bundle Analysis:** Monitor bundle size

### Backend Optimizations
- **Database Indexing:** Optimized queries
- **Connection Pooling:** Managed by Supabase
- **Geographic Distribution:** Multi-region support

## Monitoring and Analytics

### Application Monitoring
- **Error Tracking:** Console error monitoring
- **Performance Metrics:** Core Web Vitals
- **User Analytics:** Usage patterns and engagement

### Database Monitoring
- **Query Performance:** Slow query identification
- **Connection Monitoring:** Pool utilization
- **Storage Usage:** Database size tracking

## Maintenance

### Regular Tasks
- **Dependency Updates:** Monthly security patches
- **Performance Reviews:** Quarterly optimization
- **Backup Verification:** Weekly backup testing
- **Security Audits:** Bi-annual reviews

### Emergency Procedures
- **Rollback Process:** Revert to previous deployment
- **Database Recovery:** Point-in-time restore
- **Incident Response:** User communication plan

## Scaling Considerations

### Horizontal Scaling
- **CDN Expansion:** Additional edge locations
- **Database Scaling:** Supabase Pro features
- **Caching Layers:** Redis for session storage

### Vertical Scaling
- **Instance Upgrades:** Larger database instances
- **Connection Limits:** Increased concurrent users
- **Storage Expansion:** Additional database storage

## Cost Optimization

### Current Usage
- **Supabase Free Tier:** Database and auth
- **Static Hosting Provider:** Used for deploying frontend (e.g., Vercel or Netlify)
- **Bandwidth:** CDN and API calls

### Scaling Costs
- **Database:** Per-GB storage and compute
- **Bandwidth:** CDN data transfer
- **Authentication:** Active user limits

## Disaster Recovery

### Backup Strategy
- **Automated Backups:** Daily database snapshots
- **Code Repository:** Git-based version control
- **Configuration Backup:** Infrastructure as code

### Recovery Procedures
1. **Data Loss:** Restore from backup
2. **Service Outage:** Failover procedures
3. **Security Breach:** Incident response plan

## Future Deployment Enhancements

### Planned Improvements
- **Multi-environment Setup:** Staging and production
- **CI/CD Pipeline:** Automated testing and deployment
- **Monitoring Dashboard:** Real-time metrics
- **A/B Testing:** Feature flag system
