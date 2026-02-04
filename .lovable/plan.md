

# Rate Limiting System Implementation Plan

## Overview
Implement a comprehensive, secure rate limiting system similar to professional AI SaaS platforms with multiple time-based limits (per minute, per hour, per day, and per month).

## Plan Limits

| Plan | Per Minute | Per Hour | Per Day | Per Month |
|------|------------|----------|---------|-----------|
| Free | 2 | 5 | 5 | 5 |
| Pro | 10 | 100 | 300 | 1000 |

---

## Implementation Details

### 1. Database Changes
Create a new `usage_logs` table to track individual API calls with timestamps for granular rate limiting:

**New Table: `usage_logs`**
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `created_at` (timestamp with timezone, default now())
- `action_type` (text, default 'comparison') - for future extensibility (comparison, debate, export)

**Row Level Security:**
- Users can INSERT their own logs
- Users can SELECT their own logs
- Service role can manage all (for cleanup jobs)

**Index:** Create an index on `(user_id, created_at)` for fast time-range queries.

### 2. Update Subscriptions Table
Add columns to cache the latest rate limit status (optional optimization):
- No schema change needed - we'll compute limits from `usage_logs` in real-time

### 3. New Edge Function: `check-rate-limit`
A dedicated function that:
- Checks all rate limit windows (minute, hour, day, month)
- Returns detailed status for each window
- Used for proactive UI updates and validation

### 4. Update `track-usage` Edge Function
Enhance to:
- Check all rate limits BEFORE incrementing
- Insert into `usage_logs` table
- Return detailed rate limit info
- Handle monthly reset logic

**Rate Limit Check Logic:**
```
For each window (minute=1, hour=60, day=1440, month=43200 minutes):
  1. Count records in usage_logs where:
     - user_id = current user
     - created_at >= (now - window duration)
  2. Compare against plan limit for that window
  3. If ANY window exceeds limit, reject with 429
```

### 5. Frontend Hook Updates (`useSubscription.ts`)

**New State:**
- `rateLimits` object containing current usage and limits for each window
- `isRateLimited` boolean
- `nextResetTimes` for each window

**New Functions:**
- `checkRateLimits()` - proactively check all limits
- `getRateLimitStatus()` - get formatted status for UI

**Updated Constants:**
```typescript
export const FREE_PLAN_LIMITS = {
  perMinute: 2,
  perHour: 5,
  perDay: 5,
  perMonth: 5,
  allowedModels: ['google/gemini-2.5-flash-lite', 'openai/gpt-5-nano'],
  maxModelsPerComparison: 2,
};

export const PRO_PLAN_LIMITS = {
  perMinute: 10,
  perHour: 100,
  perDay: 300,
  perMonth: 1000,
  maxModelsPerComparison: 5,
};
```

### 6. Enhanced Usage Alert Component
Update `UsageAlert.tsx` to show:
- Multi-tier progress bars (minute/hour/day/month)
- Time until each limit resets
- Which specific limit was hit
- Animated countdown timers

### 7. Pricing Page Updates
Update `Pricing.tsx` to display:
- Per-minute, per-hour, per-day, per-month limits
- Clear comparison between Free and Pro
- Rate limit explanation in FAQ

---

## Technical Flow

```text
User clicks "Compare"
       |
       v
[Frontend: Check hasReachedLimit]
       |
       v
[Call track-usage Edge Function]
       |
       v
[Edge Function: Check ALL rate limits]
  |        |
  v        v
[Under   [Over Limit]
 Limit]      |
  |          v
  v      [Return 429 + which limit hit]
[Insert usage_log]
  |
  v
[Return success + remaining limits]
       |
       v
[Frontend: Update UI + proceed with comparison]
```

---

## Files to Create/Modify

**New Files:**
- `supabase/migrations/[timestamp]_add_rate_limiting.sql` - Database migration

**Modified Files:**
- `supabase/functions/track-usage/index.ts` - Full rate limit checking
- `src/hooks/useSubscription.ts` - New rate limit state and functions
- `src/components/UsageAlert.tsx` - Multi-tier rate limit display
- `src/pages/Pricing.tsx` - Update plan comparison
- `src/pages/Index.tsx` - Handle rate limit errors with specific messages

---

## Security Considerations

1. **All rate limiting is server-side** - Cannot be bypassed by client manipulation
2. **Atomic operations** - Check and increment happen in same transaction
3. **Service role key** - Used for database operations to bypass RLS for reads
4. **IP-based fallback** - Future enhancement for unauthenticated requests
5. **Usage log retention** - Consider cleanup policy for old logs (keep 30 days)

---

## Error Messages

| Limit Hit | Message |
|-----------|---------|
| Per Minute | "Slow down! You've made too many requests. Try again in X seconds." |
| Per Hour | "Hourly limit reached. Resets in X minutes." |
| Per Day | "Daily limit reached. Resets at midnight." |
| Per Month | "Monthly limit reached. Upgrade to Pro for 1000 credits/month." |

