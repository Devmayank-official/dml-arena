

## Plan: Rename Edge Functions to DML Arena Branding

### What We're Doing
Creating new edge functions with DML Arena-branded names, updating all frontend references, updating `config.toml`, and deleting the old functions.

### Rename Map

| Old Function | New Function | Referenced In |
|---|---|---|
| `compare-ai` | `dml-arena` | (not referenced in frontend, only in `supabase/functions/`) |
| `compare-ai-stream` | `dml-arena-stream` | `src/hooks/useStreamingComparison.ts` |
| `deep-debate` | `dml-debate` | `src/hooks/useDeepDebate.ts` |
| `track-usage` | `dml-track-usage` | `src/hooks/useSubscription.ts` |

Razorpay functions stay as-is (they're payment-specific, not branded).

### Steps

1. **Create 4 new edge function files** with new names, copying the exact same code from the old ones:
   - `supabase/functions/dml-arena/index.ts` (from `compare-ai/index.ts`)
   - `supabase/functions/dml-arena-stream/index.ts` (from `compare-ai-stream/index.ts`)
   - `supabase/functions/dml-debate/index.ts` (from `deep-debate/index.ts`)
   - `supabase/functions/dml-track-usage/index.ts` (from `track-usage/index.ts`)

2. **Update `supabase/config.toml`** to add entries for new functions (no JWT verification settings needed for these since they aren't in config currently, but we'll check).

3. **Update frontend references** (3 files):
   - `src/hooks/useStreamingComparison.ts`: `compare-ai-stream` → `dml-arena-stream`
   - `src/hooks/useDeepDebate.ts`: `deep-debate` → `dml-debate`
   - `src/hooks/useSubscription.ts`: `track-usage` → `dml-track-usage`

4. **Delete old edge function files** (4 files):
   - `supabase/functions/compare-ai/index.ts`
   - `supabase/functions/compare-ai-stream/index.ts`
   - `supabase/functions/deep-debate/index.ts`
   - `supabase/functions/track-usage/index.ts`

### What Stays the Same
- All database tables (no brand names in them)
- Razorpay edge functions (payment-specific names)
- All function logic (identical code, just new folder names)

