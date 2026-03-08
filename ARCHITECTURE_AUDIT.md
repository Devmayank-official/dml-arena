# DML Arena — Architecture Audit & Enterprise Upgrade Plan

## Audited Against: SKILL.md v1.0.0 (Enterprise React SPA Master Skill)

> **Date:** 2026-03-08  
> **Scope:** Full codebase audit against enterprise-grade React SPA standards  
> **Current State:** Functional MVP with significant architectural debt  

---

## 🔴 CRITICAL ISSUES (Must Fix)

### 1. No Error Boundaries
**SKILL Requirement:** Error boundaries at route and feature level (Section 2)  
**Current State:** Zero `ErrorBoundary` components anywhere in the codebase  
**Impact:** A single component crash takes down the entire application  
**Fix:** Add `ErrorBoundary` at root, per-route, and per-feature level  

### 2. No Suspense Boundaries
**SKILL Requirement:** Suspense boundaries for all async/lazy components (Section 2)  
**Current State:** No `React.lazy()` or `<Suspense>` usage anywhere  
**Impact:** No code splitting — entire app loads as one monolithic bundle  
**Fix:** Lazy-load all route pages, wrap with Suspense + skeleton fallbacks  

### 3. No Code Splitting
**SKILL Requirement:** Code splitting on ALL routes (Section 2, 11)  
**Current State:** All 14 pages imported eagerly in `App.tsx` (lines 12-28)  
**Impact:** ~500KB+ initial bundle; poor LCP on slow connections  
**Fix:** `React.lazy()` for every page import in `App.tsx`  

### 4. `any` Types Used Extensively
**SKILL Requirement:** No `any` — use `unknown` + narrowing (Section 2)  
**Current State:** `any` used in multiple files:  
- `src/types/index.ts:29` — `settings: any`  
- `src/types/index.ts:30` — `round_responses: any[]`  
- Multiple hooks use untyped API responses  
**Fix:** Replace all `any` with proper Zod-validated types  

### 5. `useEffect` for Data Fetching (Anti-Pattern)
**SKILL Requirement:** Never use `useEffect` for data fetching — use TanStack Query (Section 2, 16)  
**Current State:** Several hooks use `useEffect` + `useState` pattern:  
- `useSubscription.ts` — manual fetch in useEffect  
- `useHistory.ts` — likely same pattern  
- `useFavorites.ts`, `useProfile.ts`, etc.  
**Fix:** Migrate all to TanStack Query `useQuery` / `useMutation`  

### 6. No Form Validation with Zod
**SKILL Requirement:** React Hook Form + Zod for ALL forms (Section 2)  
**Current State:** Chat input and settings forms use raw `useState` without validation  
**Fix:** Add Zod schemas for all user inputs (chat, settings, profile)  

### 7. No Environment Variable Validation
**SKILL Requirement:** Env vars validated at startup via Zod (Section 6.2)  
**Current State:** Raw `import.meta.env.VITE_*` used directly throughout codebase  
**Fix:** Create `src/constants/config.ts` with Zod validation  

---

## 🟡 MAJOR ISSUES (Should Fix)

### 8. God Components (>150 Lines JSX)
**SKILL Requirement:** No God components > 150 lines of JSX (Section 2)  
**Current State:**  
- `src/pages/Index.tsx` — 549 lines (main arena page)  
- `src/pages/Settings.tsx` — likely 300+ lines  
- `src/pages/History.tsx` — likely 300+ lines  
- `src/hooks/useSubscription.ts` — 257 lines  
**Fix:** Break into feature-based sub-components  

### 9. Type-Based Folder Structure (Not Feature-Based)
**SKILL Requirement:** Feature-based folder structure (Section 2, 4)  
**Current State:** Flat structure — all components in `src/components/`, all hooks in `src/hooks/`  
**Ideal Structure:**
```
src/features/
  arena/          # Main comparison feature
  debate/         # Deep debate mode
  community/      # Community feed & voting
  leaderboard/    # Rankings & charts
  auth/           # Authentication
  settings/       # User settings
  history/        # History management
  subscription/   # Plans & billing
```
**Fix:** Gradually migrate to feature modules with public barrel exports  

### 10. No Global State Management (Zustand)
**SKILL Requirement:** Zustand for ALL global client state (Section 3)  
**Current State:** State scattered across `useState` in page components and prop drilling  
- Selected models passed through props  
- Settings fetched per-component  
- Auth state in a custom hook without store  
**Fix:** Create Zustand stores for: `arenaStore`, `settingsStore`, `authStore`, `uiStore`  

### 11. No Structured Logger in Production
**SKILL Requirement:** No console.log in production (Section 2)  
**Current State:** Has `src/lib/logger.ts` but still uses `console.log`/`console.error` directly in:  
- Edge functions  
- Multiple hooks  
- Component error handlers  
**Fix:** Enforce logger usage, strip console.* in production  

### 12. Default Exports Used for Feature Components
**SKILL Requirement:** Named exports for ALL components (Section 2)  
**Current State:** Every page uses `export default`:  
- `export default function Index()` (Index.tsx:44)  
- All pages follow this pattern  
**Fix:** Convert to named exports with barrel files  

### 13. No Accessibility Standards (WCAG 2.1 AA)
**SKILL Requirement:** WCAG 2.1 AA compliance (Section 2, 14)  
**Current State:**  
- No skip-to-content link  
- Missing ARIA labels on icon-only buttons  
- No focus trap in modals/sheets  
- No aria-live regions for streaming updates  
- No reduced motion support  
**Fix:** Comprehensive a11y audit and remediation  

---

## 🟢 EXISTING GOOD PRACTICES

| Practice | Status | Notes |
|---|---|---|
| TypeScript | ✅ | Used throughout |
| Tailwind CSS | ✅ | Design tokens in CSS variables |
| shadcn/ui | ✅ | Radix primitives used |
| Framer Motion | ✅ | Animations present |
| TanStack Query | ✅ | Installed but underutilized |
| React Router v6 | ✅ | Working routing |
| Sonner Toasts | ✅ | Notification system |
| Dark Mode | ✅ | Theme provider with CSS vars |
| PWA Support | ✅ | Service worker + manifest |
| Semantic CSS Tokens | ✅ | HSL design tokens in index.css |
| RLS Policies | ✅ | All tables secured |
| Edge Functions | ✅ | Server-side API calls |
| Rate Limiting | ✅ | Multi-tier system |

---

## 🚀 FEATURE GAP ANALYSIS (vs. LM Arena / Chatbot Arena)

### Features DML Arena HAS ✅
1. Multi-model comparison (55+ models)
2. Real-time streaming responses
3. Deep Debate mode (multi-round synthesis)
4. Community voting & leaderboard
5. Response diff view
6. Export (PDF, MD, JSON, image)
7. Favorites & pinning
8. Model performance tracking
9. Rate limiting & subscription tiers
10. PWA with offline support
11. Keyboard shortcuts
12. Command palette
13. Voice input
14. Response quality ratings

### Features DML Arena is MISSING ❌

#### Tier 1 — Core (LM Arena Parity)
| # | Feature | Description | Effort |
|---|---|---|---|
| F1 | **Blind/Anonymous Voting** | Hide model names, let users vote on quality, then reveal — the core LM Arena mechanic | Large |
| F2 | **ELO Rating System** | Statistical ranking based on head-to-head blind comparisons (Bradley-Terry model) | Large |
| F3 | **Battle Mode** | 1v1 random model matchup (side-by-side, model names hidden until vote) | Medium |
| F4 | **Categories Leaderboard** | Separate rankings for Coding, Math, Reasoning, Creative Writing, etc. | Medium |
| F5 | **Multi-Turn Conversations in Arena** | Continue the same conversation to test context retention | Medium |

#### Tier 2 — Differentiation
| # | Feature | Description | Effort |
|---|---|---|---|
| F6 | **Vision Arena** | Upload images, compare model vision capabilities | Large |
| F7 | **Code Execution Arena** | Run generated code in sandbox, compare outputs | Large |
| F8 | **Cost Calculator** | Show $/query for each model, cost comparison | Small |
| F9 | **Latency Benchmarks** | Real-time TTFB, tokens/sec displayed per model | Small |
| F10 | **Model Comparison Matrix** | Feature comparison table (context length, pricing, capabilities) | Medium |

#### Tier 3 — Enterprise / Advanced
| # | Feature | Description | Effort |
|---|---|---|---|
| F11 | **Team Workspaces** | Shared comparisons, team API keys, usage dashboards | Large |
| F12 | **Custom Model Endpoints** | BYOM (Bring Your Own Model) — connect custom API | Large |
| F13 | **Prompt Templates Library** | Community-shared prompts for testing | Medium |
| F14 | **Automated Benchmarking** | Run pre-defined test suites across models | Large |
| F15 | **Webhook Notifications** | Alert when models change rankings significantly | Small |
| F16 | **API Access** | REST API for programmatic comparisons | Large |
| F17 | **SSO / SAML** | Enterprise authentication | Medium |

#### Tier 4 — Polish & Growth
| # | Feature | Description | Effort |
|---|---|---|---|
| F18 | **Onboarding Tutorial** | Interactive tour for new users (partially exists) | Small |
| F19 | **Model Changelog** | Track when models are updated/deprecated | Small |
| F20 | **Response Caching** | Cache identical queries to save API calls | Medium |
| F21 | **Collaborative Annotations** | Pro users annotate & highlight response sections | Medium |
| F22 | **Mobile-Native Experience** | Bottom sheet interactions, swipe between responses | Medium |
| F23 | **i18n / Localization** | Multi-language support | Medium |
| F24 | **Analytics Dashboard** | Admin view: total comparisons, popular models, trends | Medium |

---

## 🏗️ IMPLEMENTATION PRIORITY MATRIX

### Phase 1: Foundation (Architecture) — 2-3 weeks
> Fix structural issues that block everything else

1. ☐ Add Error Boundaries (root + route level)
2. ☐ Add Code Splitting with React.lazy + Suspense
3. ☐ Create Zod-validated env config module
4. ☐ Replace all `any` types with proper types
5. ☐ Migrate critical hooks to TanStack Query
6. ☐ Add input validation (Zod) for chat & forms

### Phase 2: Architecture Refactor — 2-3 weeks
> Reorganize for maintainability

7. ☐ Feature-based folder structure migration
8. ☐ Zustand stores (auth, arena, settings, ui)
9. ☐ Break God components into sub-components
10. ☐ Convert to named exports
11. ☐ Bundle optimization (manual chunks in Vite)

### Phase 3: LM Arena Parity Features — 4-6 weeks
> The killer differentiators

12. ☐ Battle Mode (1v1 blind comparison)
13. ☐ ELO Rating System + database tables
14. ☐ Categories Leaderboard
15. ☐ Cost Calculator & Latency Display
16. ☐ Model Comparison Matrix

### Phase 4: Enterprise & Polish — 4-6 weeks
> Scale and differentiate

17. ☐ Vision Arena (image comparison)
18. ☐ Accessibility audit (WCAG 2.1 AA)
19. ☐ i18n framework
20. ☐ Team Workspaces
21. ☐ API Access for programmatic use

---

## 📊 CURRENT CODEBASE METRICS

| Metric | Current | Target (SKILL.md) | Status |
|---|---|---|---|
| TypeScript strict | Partial | Full strict | 🟡 |
| `any` usage | Multiple files | Zero | 🔴 |
| Error Boundaries | 0 | Route + Feature level | 🔴 |
| Code Splitting | None | All routes | 🔴 |
| Env Validation | None | Zod at startup | 🔴 |
| Bundle Size (initial) | ~500KB+ est. | <200KB gzipped | 🔴 |
| Accessibility | Basic | WCAG 2.1 AA | 🟡 |
| Test Coverage | 0% | 70-95% by layer | 🔴 |
| Lighthouse Perf | Unknown | 90+ | 🟡 |
| Forms w/ Zod | 0 | All forms | 🔴 |
| Feature Structure | Flat | Feature-based | 🟡 |
| State Management | useState | Zustand | 🟡 |

---

## 🗄️ DATABASE SCHEMA STATUS

### Existing Tables (11)
| Table | RLS | Status |
|---|---|---|
| profiles | ✅ | Working |
| subscriptions | ✅ | Working |
| comparison_history | ✅ | Working |
| debate_history | ✅ | Working |
| response_votes | ✅ | Working |
| response_ratings | ✅ | Working |
| community_votes | ✅ | Working |
| shared_results | ✅ | Working |
| model_performance | ✅ | Working |
| usage_logs | ✅ | Working |
| payments | ✅ | Working |
| user_favorites | ✅ | Working |

### Tables Needed for New Features
| Table | Purpose | For Feature |
|---|---|---|
| `battles` | 1v1 blind comparison records | Battle Mode (F1, F3) |
| `battle_votes` | User votes on blind battles | Battle Mode (F1, F3) |
| `elo_ratings` | Model ELO scores by category | ELO System (F2) |
| `prompt_templates` | Community prompt library | Prompt Templates (F13) |
| `team_workspaces` | Team/org management | Team Workspaces (F11) |
| `team_members` | Workspace membership | Team Workspaces (F11) |
| `api_keys` | Programmatic API access keys | API Access (F16) |
| `model_changelog` | Model version history | Model Changelog (F19) |
| `response_cache` | Cached identical queries | Response Caching (F20) |
| `annotations` | User highlights on responses | Annotations (F21) |

### Edge Functions Status
| Function | Purpose | Status |
|---|---|---|
| `dml-arena` | Non-streaming comparison | ✅ Working |
| `dml-arena-stream` | Streaming comparison | ✅ Working |
| `dml-debate` | Multi-round debate | ✅ Working |
| `dml-track-usage` | Rate limit tracking | ✅ Working |
| `razorpay-create-order` | Payment creation | ✅ Working |
| `razorpay-verify-payment` | Payment verification | ✅ Working |
| `razorpay-webhook` | Payment webhooks | ✅ Working |
| `razorpay-cancel-subscription` | Cancel subscription | ✅ Working |

### Edge Functions Needed
| Function | Purpose | For Feature |
|---|---|---|
| `dml-battle` | 1v1 blind model battle | Battle Mode |
| `dml-elo-update` | Recalculate ELO ratings | ELO System |
| `dml-vision-compare` | Image-based comparison | Vision Arena |
| `dml-code-execute` | Sandbox code runner | Code Arena |
| `dml-api-gateway` | Public API proxy | API Access |

### Database Functions / RPC Needed
| Function | Purpose |
|---|---|
| `calculate_elo_rating()` | Bradley-Terry model ELO calculation |
| `get_model_rankings(category)` | Leaderboard query with ELO |
| `get_battle_stats(model_id)` | Win/loss/draw stats per model |
| `get_trending_models(period)` | Models gaining/losing ranking |

---

## 🔐 SECURITY AUDIT

| Check | Status | Notes |
|---|---|---|
| RLS on all tables | ✅ | All 11 tables have RLS |
| JWT validation in edge functions | ✅ | dml-track-usage validates |
| API keys server-side only | ✅ | LOVABLE_API_KEY in edge fn |
| No secrets in client code | ✅ | Uses env vars properly |
| Input length validation | ✅ | 10K char limit server-side |
| Rate limiting | ✅ | Multi-tier enforcement |
| CORS headers | ✅ | Set in edge functions |
| XSS prevention | 🟡 | Markdown rendering needs DOMPurify |
| CSRF protection | 🟡 | Supabase handles via JWT |
| Auth tokens in memory | 🟡 | Supabase SDK handles storage |

---

---

## ✅ APPROVED DECISIONS (2026-03-08)

| Decision | Choice |
|---|---|
| **Priority** | Phase 1: Fix Foundation first |
| **Key Features** | Battle Mode (1v1 Blind) + Cost & Latency Display |
| **Architecture** | Feature-based folder structure |
| **State Mgmt** | Full Zustand (arena, auth, settings, ui stores) |

### Phase 1 — Completed ✅
1. ✅ Error Boundaries (root + route + feature level) — `ErrorBoundary.tsx`
2. ✅ Code Splitting with `React.lazy()` + `<Suspense>` for all 15 pages — `App.tsx`
3. ☐ Create `src/constants/config.ts` with Zod env validation
4. ☐ Replace all `any` types with proper typed interfaces
5. ☐ Migrate `useSubscription`, `useHistory`, `useFavorites` to TanStack Query
6. ☐ Add Zod schemas for chat input, settings forms, profile forms

### Phase 2 — Completed ✅
7. ✅ Feature-based folder structure — `src/features/arena/` created
8. ✅ Zustand stores — `auth.store.ts`, `settings.store.ts`, `arena.store.ts`, `ui.store.ts`
9. ✅ Break God components — Index.tsx 549→155 lines, split into arena sub-components
10. ✅ Named exports — All pages now export both named + default
11. ✅ Bundle optimization — Manual chunks in Vite (react, router, query, motion, ui, markdown, charts, supabase, zustand)

### Next — Feature Implementation
12. ☐ Battle Mode (1v1 blind comparison) — new table + edge function + UI
13. ☐ Cost & Latency Display — tokens/sec, TTFB, $/query per model

---

*Updated: 2026-03-08 | Based on SKILL.md v1.0.0 Enterprise Standards*
