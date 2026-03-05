

## Problem

`AI_MODELS` contains only ~5 base models (OpenAI + Google). The remaining 50+ models live in `OPENROUTER_MODELS`. Multiple files import only `AI_MODELS`, so they can't see/display/track the full model library.

### Affected Files (8 total)

| File | Usage | Impact |
|---|---|---|
| `src/pages/Settings.tsx:388` | `AI_MODELS.map()` for default model picker | Only shows ~5 models to choose from |
| `src/pages/History.tsx:375` | `AI_MODELS.map()` for model filter popover | Filter dropdown missing 50+ models |
| `src/hooks/useLeaderboardData.ts:86,144` | `AI_MODELS.forEach/map` for stats | Leaderboard ignores all OpenRouter model data |
| `src/components/community/CommunityFeed.tsx:117` | `AI_MODELS.find()` for model name lookup | Shows raw model ID instead of name for OpenRouter models |
| `src/components/QuickReRun.tsx:72` | `AI_MODELS.map()` for re-run model list | Can only re-run with ~5 base models |
| `src/components/BulkExport.tsx:35` | `AI_MODELS.find()` for model name | Exports show raw IDs |
| `src/lib/exportUtils.ts:27` | `AI_MODELS.find()` for model name | Same export issue |
| `src/components/ModelPresetSelector.tsx:116,216` | `AI_MODELS.find()` for preset display | Preset model names unresolved |

### Fix

Since `hasSystemOpenRouterKey()` always returns `true` (line 816-819), all models are always available. The simplest fix: create a single `ALL_MODELS` constant and use it everywhere.

**Step 1**: In `src/lib/models.ts`, add after `OPENROUTER_MODELS`:
```ts
export const ALL_MODELS: AIModel[] = [...AI_MODELS, ...OPENROUTER_MODELS];
```

**Step 2**: Update all 8 files to import `ALL_MODELS` instead of `AI_MODELS`:

- **Settings.tsx**: Replace `AI_MODELS.map` with `ALL_MODELS.map` in the default models grid. Add a search/filter since 55+ models is a long list — group by provider with collapsible sections.
- **History.tsx**: Replace `AI_MODELS.map` with `ALL_MODELS.map` in the model filter popover. Add search input since the list is now large.
- **useLeaderboardData.ts**: Replace both `AI_MODELS` references with `ALL_MODELS` so leaderboard tracks all models.
- **CommunityFeed.tsx**: Replace `AI_MODELS.find` with `ALL_MODELS.find` (or `getModelById`).
- **QuickReRun.tsx**: Replace `AI_MODELS.map` with `ALL_MODELS.map`. Group by provider.
- **BulkExport.tsx**: Replace `AI_MODELS.find` with `getModelById`.
- **exportUtils.ts**: Replace `AI_MODELS.find` with import from `getModelById`.
- **ModelPresetSelector.tsx**: Replace `AI_MODELS.find` with `getModelById`.

**Step 3**: For Settings and History model lists (now 55+ items), add:
- A search input to filter models
- Group models by provider with provider headers
- ScrollArea to keep the UI manageable

### No backend/database changes needed
This is purely a frontend fix — the database already stores whatever model IDs the user compared with.

