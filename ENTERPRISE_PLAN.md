# DML Arena — Enterprise Transformation Plan v2.0

## Audited Against: SKILL.md v1.0.0 | PRD.md v2.0 | LM Arena Competitive Analysis

> **Date:** 2026-03-08
> **Target:** $500M+ AI SaaS Platform — Enterprise Grade, Self-Hostable (Admin), Production-Ready
> **Scope:** Complete gap analysis, feature roadmap, architecture remediation

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [SKILL.md Compliance Audit](#2-skillmd-compliance-audit)
3. [Architecture Violations & Fixes](#3-architecture-violations--fixes)
4. [Feature Gap Analysis vs LM Arena](#4-feature-gap-analysis-vs-lm-arena)
5. [Enterprise Feature Suggestions](#5-enterprise-feature-suggestions)
6. [Security Hardening Plan](#6-security-hardening-plan)
7. [Self-Hosting Architecture](#7-self-hosting-architecture)
8. [Scalability Plan](#8-scalability-plan)
9. [Implementation Phases](#9-implementation-phases)
10. [Database Schema Additions](#10-database-schema-additions)
11. [Edge Functions Needed](#11-edge-functions-needed)
12. [Quality Gates](#12-quality-gates)

---

## 1. EXECUTIVE SUMMARY

DML Arena is a functional MVP with **significant architectural debt** when measured against SKILL.md enterprise standards. The platform has strong foundations (RLS, edge functions, streaming, PWA) but needs systematic refactoring to reach $500M+ SaaS quality.

### Current Scorecard

| Category | Score | Target | Gap |
|---|---|---|---|
| SKILL.md Compliance | 35% | 95%+ | 🔴 Critical |
| Type Safety | 60% | 100% | 🔴 Critical |
| Code Splitting | ✅ Done | Done | 🟢 |
| Error Boundaries | ✅ Done | Done | 🟢 |
| Feature-Based Structure | 30% | 100% | 🟡 Major |
| State Management (Zustand) | 40% | 100% | 🟡 Major |
| TanStack Query Adoption | 10% | 100% | 🔴 Critical |
| Form Validation (RHF+Zod) | 0% | 100% | 🔴 Critical |
| Env Validation (Zod) | 0% | 100% | 🔴 Critical |
| Testing | 0% | 70-95% | 🔴 Critical |
| Accessibility (WCAG 2.1 AA) | 20% | 100% | 🔴 Critical |
| i18n | 0% | 100% | 🟡 Planned |
| LM Arena Feature Parity | 40% | 90%+ | 🟡 Major |
| Self-Host Readiness | 50% | 100% | 🟡 Major |

---

## 2. SKILL.md COMPLIANCE AUDIT

### 🔴 CRITICAL VIOLATIONS (Must Fix Before Production)

#### V1. `any` Types Used Extensively
**SKILL Ref:** Section 2 — "No `any` — use `unknown` + narrowing"
**Violations Found:**
- `src/types/index.ts:29` → `settings: any`
- `src/types/index.ts:30` → `round_responses: any[]`
- `src/hooks/useHistory.ts:45` → `round_responses as unknown as any[]`
- `src/hooks/useHistory.ts:78` → `responses as any`
- `src/hooks/useHistory.ts:100` → `settings: any`, `roundResponses: any[]`
- `src/hooks/useHistory.ts:115-116` → multiple `as any` casts
- `PRD.md:449` → `debateRounds?: any[]` in ExportData interface
**Impact:** Type safety completely broken for debate & history features
**Fix:** Create proper Zod schemas for `DebateSettings`, `RoundResponse`, `ExportData`

#### V2. `useEffect` for Data Fetching (Anti-Pattern)
**SKILL Ref:** Section 2, 16 — "Never use useEffect for data fetching — use TanStack Query"
**Violations Found:**
- `useSubscription.ts` — `useEffect` + `useState` + manual `fetchSubscription()`
- `useHistory.ts` — `useEffect` + `useState` + manual `fetchHistory()`
- `useFavorites.ts` — `useEffect` + `useState` + manual `fetchFavorites()`
- `useProfile.ts` — likely same pattern
- `useCommunityFeed.ts` — likely same pattern
- `useLeaderboardData.ts` — likely same pattern
- `useModelPerformance.ts` — likely same pattern
- `useRatings.ts` — likely same pattern
**Impact:** No caching, no background refetch, no optimistic updates, no stale-while-revalidate, manual loading/error states everywhere
**Fix:** Migrate ALL to TanStack Query `useQuery`/`useMutation` with proper query key factories

#### V3. No Form Validation (React Hook Form + Zod)
**SKILL Ref:** Section 2, 6.6 — "React Hook Form + Zod for ALL forms"
**Violations Found:**
- `ChatInput.tsx` — raw `useState` for message input, no validation
- `Auth.tsx` — likely raw state for email/password
- `Settings.tsx` — raw state for settings forms
- `Profile.tsx` — raw state for profile edit
- `ApiKeysSettings.tsx` — raw state for API key inputs
- `DeepModeToggle.tsx` — settings without schema validation
**Impact:** No client-side validation, no type-safe form data, potential XSS via unvalidated input
**Fix:** Create Zod schemas + React Hook Form for every user input surface

#### V4. No Environment Variable Validation
**SKILL Ref:** Section 6.2 — "Env vars validated at startup via Zod"
**Current State:** Raw `import.meta.env.VITE_*` used directly in:
- `useStreamingComparison.ts:62` → `import.meta.env.VITE_SUPABASE_URL`
- `useStreamingComparison.ts:67` → `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`
- `useSubscription.ts:147` → `import.meta.env.VITE_SUPABASE_URL`
- Multiple other locations
**Fix:** Create `src/constants/config.ts` with Zod validation at app startup

#### V5. No Testing Infrastructure
**SKILL Ref:** Section 13 — Coverage: Utils 95%+, Hooks 85%+, Components 70%+
**Current State:** Zero test files, no Vitest config, no MSW mocks, no Playwright
**Impact:** Zero confidence in refactoring, no regression protection
**Fix:** Set up Vitest + React Testing Library + MSW + Playwright

#### V6. `console.log` in Production Code
**SKILL Ref:** Section 2 — "No console.log in production code"
**Violations Found:**
- `useStreamingComparison.ts:120` → `console.error('Streaming error:', error)`
- `useSubscription.ts:81,92,202` → multiple `console.error` calls
- `useHistory.ts:62,93,143,189,229,246` → multiple `console.error` calls
- `useFavorites.ts:36,81,107` → multiple `console.error` calls
- `App.tsx:38-41` → `logger.info` at module level (acceptable but noisy)
**Fix:** Replace ALL with structured `logger.*` calls, strip console.* in production build

#### V7. No Route Constants
**SKILL Ref:** Section 16 — "No hardcoded route strings"
**Current State:** Routes hardcoded as strings throughout `App.tsx` and navigation components
**Fix:** Create `src/constants/routes.ts` with route path constants

#### V8. No Query Key Factory
**SKILL Ref:** Section 6.3 — "Centralized query keys factory"
**Current State:** No query key management (TanStack Query barely used)
**Fix:** Create `src/constants/query-keys.ts` with typed factory pattern

### 🟡 MAJOR VIOLATIONS

#### V9. Incomplete Feature-Based Structure
**SKILL Ref:** Section 4 — Feature-based folder structure
**Current State:** Only `src/features/arena/` migrated. 60+ components still in flat `src/components/`
**Missing Feature Modules:**
```
src/features/
  auth/           # Login, Register, OAuth, ProtectedRoute
  debate/         # Deep Mode, debate settings, synthesis
  community/      # Feed, voting, shared results
  leaderboard/    # Rankings, charts, stats
  history/        # Comparison & debate history
  settings/       # User settings, API keys, profile
  subscription/   # Plans, billing, rate limits
  export/         # All export formats
  battle/         # (New) 1v1 blind comparison
```

#### V10. ProtectedRoute Duplicates Auth Logic
**Current State:** `ProtectedRoute.tsx` creates its OWN auth subscription instead of using `useAuthStore`
**Impact:** Duplicate Supabase listeners, potential state sync issues
**Fix:** Refactor to use `useAuthStore` from Zustand

#### V11. No DOMPurify for Markdown Rendering
**SKILL Ref:** Section 12 — "Sanitize HTML with DOMPurify"
**Current State:** `MarkdownContent.tsx` renders user/AI content without sanitization
**Impact:** Potential XSS via malicious AI responses or user input
**Fix:** Add DOMPurify sanitization layer

#### V12. No i18n Framework
**SKILL Ref:** Section 3 (recommended) — "react-i18next for internationalization"
**Current State:** All strings hardcoded in English
**Fix:** Add react-i18next with namespace support and lazy-loaded locales

#### V13. API Key Storage in localStorage (Security Risk)
**SKILL Ref:** Section 12 — "Auth tokens stored in memory NOT localStorage"
**Current State:** User API keys stored in browser localStorage
**Impact:** Vulnerable to XSS attacks
**Fix:** Move to Zustand in-memory store with optional encrypted persistence

#### V14. No Skip-to-Content / ARIA Labels
**SKILL Ref:** Section 14 — WCAG 2.1 AA
**Missing:**
- Skip-to-main-content link
- ARIA labels on icon-only buttons (ThemeToggle, MobileNav hamburger, etc.)
- Focus trap in modals/sheets
- `aria-live` regions for streaming updates
- `prefers-reduced-motion` support

---

## 3. ARCHITECTURE VIOLATIONS & FIXES

### Summary Table

| # | Violation | SKILL Section | Severity | Effort | Status |
|---|---|---|---|---|---|
| V1 | `any` types | §2 | 🔴 Critical | Medium | ☐ TODO |
| V2 | useEffect for data fetching | §2,16 | 🔴 Critical | Large | ☐ TODO |
| V3 | No form validation | §2,6.6 | 🔴 Critical | Medium | ☐ TODO |
| V4 | No env validation | §6.2 | 🔴 Critical | Small | ☐ TODO |
| V5 | No tests | §13 | 🔴 Critical | Large | ☐ TODO |
| V6 | console.log in prod | §2 | 🟡 Major | Small | ☐ TODO |
| V7 | No route constants | §16 | 🟡 Major | Small | ☐ TODO |
| V8 | No query key factory | §6.3 | 🟡 Major | Small | ☐ TODO |
| V9 | Incomplete feature structure | §4 | 🟡 Major | Large | ☐ Partial |
| V10 | ProtectedRoute duplication | §3 | 🟡 Major | Small | ☐ TODO |
| V11 | No DOMPurify | §12 | 🟡 Major | Small | ☐ TODO |
| V12 | No i18n | §3 | 🟡 Major | Large | ☐ TODO |
| V13 | localStorage API keys | §12 | 🟡 Major | Medium | ☐ TODO |
| V14 | Accessibility gaps | §14 | 🟡 Major | Large | ☐ TODO |

### What IS Working ✅

| Item | Status |
|---|---|
| Error Boundaries (root + route) | ✅ Implemented |
| Code Splitting (React.lazy + Suspense) | ✅ All 15 pages |
| Zustand Stores (4 stores) | ✅ auth, arena, settings, ui |
| God Component Decomposition | ✅ Index.tsx 549→155 lines |
| Vite Manual Chunks | ✅ 10 vendor chunks |
| RLS on all 12 tables | ✅ Enforced |
| Server-side rate limiting | ✅ Multi-tier |
| Streaming SSE architecture | ✅ Production-ready |
| PWA with service worker | ✅ Offline support |
| Dark/Light mode | ✅ CSS variables |
| 55+ AI models | ✅ Multi-provider |

---

## 4. FEATURE GAP ANALYSIS vs LM ARENA

### What LM Arena Has That DML Arena Doesn't

| # | Feature | LM Arena | DML Arena | Priority | Effort |
|---|---|---|---|---|---|
| F1 | **Blind/Anonymous Voting** | ✅ Core mechanic | ❌ Missing | 🔴 P0 | Large |
| F2 | **ELO Rating System** | ✅ Bradley-Terry | ❌ Missing | 🔴 P0 | Large |
| F3 | **Battle Mode (1v1)** | ✅ Random matchup | ❌ Missing | 🔴 P0 | Medium |
| F4 | **Category Leaderboards** | ✅ Coding, Math, etc. | ❌ Missing | 🟡 P1 | Medium |
| F5 | **Multi-Turn in Arena** | ✅ Context retention | ✅ Partial | 🟢 Done | - |
| F6 | **Vision Arena** | ✅ Image comparison | ❌ Missing | 🟡 P1 | Large |
| F7 | **Style Control** | ✅ Length/format prefs | ❌ Missing | 🟡 P1 | Small |
| F8 | **Side-by-Side Scroll Lock** | ✅ Synced panels | ✅ Partial | 🟢 Done | - |
| F9 | **Model Identity Reveal** | ✅ Post-vote reveal | ❌ Missing | 🔴 P0 | Medium |
| F10 | **Community Rankings Page** | ✅ Public leaderboard | ✅ Partial | 🟡 P1 | Medium |
| F11 | **Confidence Intervals** | ✅ Statistical bounds | ❌ Missing | 🟡 P1 | Medium |
| F12 | **Hard Prompts Category** | ✅ Challenging queries | ❌ Missing | 🟡 P1 | Small |

### What DML Arena Has That LM Arena Doesn't ✨

| # | Feature | DML Arena | Advantage |
|---|---|---|---|
| D1 | **Deep Mode (AI Debates)** | ✅ Multi-round synthesis | Unique differentiator |
| D2 | **11 Export Formats** | ✅ PDF, MD, JSON, YAML, etc. | Professional output |
| D3 | **Word-Level Diff View** | ✅ Inline highlighting | Detailed comparison |
| D4 | **Command Palette** | ✅ Keyboard-first UX | Power user feature |
| D5 | **PWA + Offline** | ✅ Installable | Mobile-first |
| D6 | **Custom API Keys** | ✅ BYOK for any provider | Flexibility |
| D7 | **Conversation Threading** | ✅ Multi-turn context | Context retention |
| D8 | **Response Pinning** | ✅ Save best responses | Workflow feature |
| D9 | **Performance Insights** | ✅ Per-model analytics | Data-driven |
| D10 | **Voice Input** | ✅ Speech-to-text | Accessibility |

---

## 5. ENTERPRISE FEATURE SUGGESTIONS

### Tier 0 — LM Arena Parity (Must Have)

| # | Feature | Description | Impact |
|---|---|---|---|
| E1 | **1v1 Battle Mode** | Random blind matchup, vote, reveal. Core engagement loop | 🔴 Critical |
| E2 | **ELO/Ranking System** | Bradley-Terry model ratings from blind votes | 🔴 Critical |
| E3 | **Blind Voting Flow** | Hide model names during comparison, reveal after vote | 🔴 Critical |
| E4 | **Category Benchmarks** | Separate rankings for Coding, Math, Reasoning, Creative, Instruction Following | 🟡 High |

### Tier 1 — Differentiation (Should Have)

| # | Feature | Description | Impact |
|---|---|---|---|
| E5 | **Cost & Latency Dashboard** | Real-time $/query, TTFB, tokens/sec per model | 🟡 High |
| E6 | **Vision Arena** | Upload images, compare vision model outputs | 🟡 High |
| E7 | **Code Execution Arena** | Run generated code in sandbox, compare outputs | 🟡 High |
| E8 | **Model Comparison Matrix** | Feature table: context length, pricing, capabilities, benchmarks | 🟡 High |
| E9 | **Prompt Templates Library** | Community-shared and curated prompt sets for testing | 🟡 Medium |
| E10 | **Response Caching** | Cache identical queries to save API cost and improve speed | 🟡 Medium |

### Tier 2 — Enterprise (Nice to Have)

| # | Feature | Description | Impact |
|---|---|---|---|
| E11 | **Team Workspaces** | Shared comparisons, team API keys, usage dashboards | 🟡 Medium |
| E12 | **BYOM (Bring Your Own Model)** | Connect custom model endpoints (OpenAI-compatible) | 🟡 Medium |
| E13 | **Automated Benchmarking** | Run pre-defined test suites across models with scoring | 🟡 Medium |
| E14 | **REST API Access** | Programmatic comparisons via API keys | 🟡 Medium |
| E15 | **SSO / SAML** | Enterprise authentication with identity providers | 🟡 Medium |
| E16 | **Webhook Notifications** | Alert when models change rankings significantly | 🟢 Low |
| E17 | **Model Changelog** | Track when models are updated/deprecated | 🟢 Low |
| E18 | **Admin Dashboard** | Total comparisons, popular models, revenue, user analytics | 🟡 Medium |

### Tier 3 — Polish & Growth

| # | Feature | Description | Impact |
|---|---|---|---|
| E19 | **Collaborative Annotations** | Highlight and annotate response sections | 🟢 Low |
| E20 | **Mobile-Native UX** | Bottom sheets, swipe between responses, haptic feedback | 🟡 Medium |
| E21 | **i18n / Localization** | Multi-language support (Hindi, Spanish, Chinese, Japanese, etc.) | 🟡 Medium |
| E22 | **Analytics Dashboard (User)** | Personal usage trends, model preferences, cost tracking | 🟢 Low |
| E23 | **Interactive Onboarding Tour** | Step-by-step walkthrough for new users (partially exists) | 🟢 Low |
| E24 | **Dark/Light/System + Custom Themes** | Theme customization beyond dark/light | 🟢 Low |

---

## 6. SECURITY HARDENING PLAN

### Current Security Posture

| Check | Status | Notes |
|---|---|---|
| RLS on all tables | ✅ | 12 tables secured |
| JWT validation in edge functions | ✅ | Server-side auth |
| API keys server-side only | ✅ | LOVABLE_API_KEY in edge fn |
| Input length validation (server) | ✅ | 10K char limit |
| Rate limiting (server) | ✅ | Multi-tier |
| CORS headers | ✅ | Edge functions |

### Security Gaps to Fix

| # | Gap | Risk | Fix |
|---|---|---|---|
| S1 | No DOMPurify for markdown | XSS via AI response | Add DOMPurify sanitization |
| S2 | API keys in localStorage | XSS key theft | Move to in-memory Zustand |
| S3 | No CSP headers | XSS injection | Configure in deployment |
| S4 | No input sanitization (client) | Injection attacks | Zod validation on all inputs |
| S5 | No rate limit on auth attempts | Brute force | Add auth rate limiting |
| S6 | Leaked password protection | Credential stuffing | Enable in auth config |
| S7 | No audit logging | Compliance | Add audit trail table |
| S8 | No RBAC system | Privilege escalation | Add user_roles table |
| S9 | No session invalidation | Session hijacking | Add session management |

---

## 7. SELF-HOSTING ARCHITECTURE (Admin Only)

### Current Self-Host Support
- ✅ `SELF_HOSTING.md` with Vercel/Netlify/Docker guides
- ✅ `setup.sh` script for automated setup
- ✅ Full SQL schema documented
- ✅ Edge function configs

### Self-Host Improvements Needed

| # | Improvement | Purpose |
|---|---|---|
| H1 | Docker Compose with all services | One-command deployment |
| H2 | Nginx SPA config | Client-side routing support |
| H3 | Environment variable template | All vars documented |
| H4 | Health check endpoints | Monitoring |
| H5 | Backup/restore scripts | Data management |
| H6 | Admin panel (separate SPA) | User management, analytics, config |
| H7 | Helm chart for Kubernetes | Enterprise container orchestration |
| H8 | Terraform modules | Infrastructure as Code |
| H9 | Log aggregation config | ELK/Loki integration |
| H10 | SSL/TLS auto-renewal | Let's Encrypt integration |

### Proposed Docker Architecture
```
docker-compose.yml
├── frontend (Nginx + SPA build)
├── supabase (self-hosted)
│   ├── postgres
│   ├── gotrue (auth)
│   ├── postgrest (API)
│   ├── storage
│   ├── realtime
│   └── edge-runtime (Deno)
├── redis (caching/rate-limiting)
├── minio (S3-compatible storage)
├── traefik (reverse proxy + SSL)
└── monitoring
    ├── prometheus
    ├── grafana
    └── loki
```

---

## 8. SCALABILITY PLAN

### Current Bottlenecks

| Bottleneck | Current | Target |
|---|---|---|
| Bundle Size | ~500KB+ estimated | <200KB gzipped initial |
| API Caching | None (manual useState) | TanStack Query (5min stale) |
| List Rendering | No virtualization | TanStack Virtual for >100 items |
| Image Loading | Basic lazy | CDN + responsive srcSet |
| DB Queries | No pagination beyond 50 | Cursor-based pagination |
| Real-time | No realtime subscriptions | Supabase Realtime for leaderboard |

### Scaling Targets

| Metric | Current | 10K Users | 100K Users | 1M Users |
|---|---|---|---|---|
| Concurrent Users | ~100 | 1,000 | 10,000 | 50,000 |
| Daily Comparisons | ~500 | 50K | 500K | 5M |
| Database Size | <1GB | 10GB | 100GB | 1TB |
| CDN Bandwidth | N/A | 100GB/mo | 1TB/mo | 10TB/mo |
| Edge Function Invocations | ~1K/day | 100K/day | 1M/day | 10M/day |

### Architecture at Scale
```
                    ┌─────────────┐
                    │   CDN Edge  │
                    │  (Cloudflare)│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   SPA (CSR) │
                    │  Static Files│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──┐  ┌──────▼──┐  ┌─────▼───┐
       │ Edge Fn  │  │ Edge Fn  │  │ Edge Fn  │
       │ (Arena)  │  │ (Battle) │  │ (Track)  │
       └──────┬──┘  └──────┬──┘  └─────┬───┘
              │            │            │
       ┌──────▼────────────▼────────────▼───┐
       │        PostgreSQL + pgbouncer       │
       │    (Read replicas for leaderboard)  │
       └────────────────────────────────────┘
```

---

## 9. IMPLEMENTATION PHASES

### Phase 1: Foundation Hardening (1-2 weeks)
> Fix all SKILL.md critical violations

| # | Task | Effort | Blocks |
|---|---|---|---|
| 1.1 | Create `src/constants/config.ts` — Zod env validation | Small | Nothing |
| 1.2 | Create `src/constants/routes.ts` — Route path constants | Small | Nothing |
| 1.3 | Create `src/constants/query-keys.ts` — Query key factory | Small | Nothing |
| 1.4 | Replace all `any` types with Zod schemas | Medium | Nothing |
| 1.5 | Migrate `useSubscription` to TanStack Query | Medium | 1.3 |
| 1.6 | Migrate `useHistory` to TanStack Query | Medium | 1.3 |
| 1.7 | Migrate `useFavorites` to TanStack Query | Medium | 1.3 |
| 1.8 | Migrate remaining hooks to TanStack Query | Large | 1.3 |
| 1.9 | Add Zod schemas for all forms (chat, auth, settings, profile) | Medium | Nothing |
| 1.10 | Refactor ProtectedRoute to use useAuthStore | Small | Nothing |
| 1.11 | Replace all console.log/error with logger | Small | Nothing |
| 1.12 | Add DOMPurify for markdown rendering | Small | Nothing |

### Phase 2: Feature-Based Architecture (1-2 weeks)
> Complete the modular migration

| # | Task | Effort | Blocks |
|---|---|---|---|
| 2.1 | Create `src/features/auth/` module | Medium | Nothing |
| 2.2 | Create `src/features/debate/` module | Medium | Nothing |
| 2.3 | Create `src/features/community/` module | Medium | Nothing |
| 2.4 | Create `src/features/leaderboard/` module | Medium | Nothing |
| 2.5 | Create `src/features/history/` module | Medium | Nothing |
| 2.6 | Create `src/features/settings/` module | Medium | Nothing |
| 2.7 | Create `src/features/subscription/` module | Medium | Nothing |
| 2.8 | Create `src/features/export/` module | Small | Nothing |
| 2.9 | Barrel exports for all feature modules | Small | 2.1-2.8 |

### Phase 3: LM Arena Parity Features (3-4 weeks)
> The killer differentiators

| # | Task | Effort | Blocks |
|---|---|---|---|
| 3.1 | **Battle Mode** — DB tables (battles, battle_votes) | Medium | Nothing |
| 3.2 | **Battle Mode** — `dml-battle` edge function | Medium | 3.1 |
| 3.3 | **Battle Mode** — 1v1 blind UI with vote/reveal flow | Large | 3.2 |
| 3.4 | **ELO System** — DB tables (elo_ratings) + RPC functions | Medium | 3.1 |
| 3.5 | **ELO System** — `dml-elo-update` edge function | Medium | 3.4 |
| 3.6 | **ELO System** — Leaderboard UI with rankings | Medium | 3.5 |
| 3.7 | **Category Benchmarks** — Category-specific rankings | Medium | 3.4 |
| 3.8 | **Cost & Latency** — Per-model metrics display | Small | Nothing |

### Phase 4: Enterprise & Polish (4-6 weeks)
> Scale and differentiate

| # | Task | Effort | Blocks |
|---|---|---|---|
| 4.1 | Vision Arena (image upload + comparison) | Large | Nothing |
| 4.2 | Accessibility audit (WCAG 2.1 AA) | Large | Nothing |
| 4.3 | i18n framework (react-i18next) | Large | Nothing |
| 4.4 | Team Workspaces | Large | Nothing |
| 4.5 | Admin Dashboard | Large | Nothing |
| 4.6 | REST API Access | Large | Nothing |
| 4.7 | Automated Benchmarking Suite | Large | 3.4 |
| 4.8 | BYOM (Custom Model Endpoints) | Medium | Nothing |

### Phase 5: Testing & Quality (Ongoing)
> Zero-regression guarantee

| # | Task | Effort | Blocks |
|---|---|---|---|
| 5.1 | Vitest setup + MSW mocks | Medium | Nothing |
| 5.2 | Unit tests for utils/ (95%+ coverage) | Medium | 5.1 |
| 5.3 | Hook tests (85%+ coverage) | Large | 5.1 |
| 5.4 | Component tests (70%+ coverage) | Large | 5.1 |
| 5.5 | Playwright E2E for critical flows | Large | 5.1 |
| 5.6 | CI/CD pipeline (GitHub Actions) | Medium | 5.1 |

---

## 10. DATABASE SCHEMA ADDITIONS

### New Tables Needed

| Table | Purpose | For Feature |
|---|---|---|
| `battles` | 1v1 blind comparison records | Battle Mode (E1, E3) |
| `battle_votes` | User votes on blind battles | Battle Mode (E1, E3) |
| `elo_ratings` | Model ELO scores by category | ELO System (E2) |
| `prompt_templates` | Community prompt library | Prompt Templates (E9) |
| `team_workspaces` | Team/org management | Team Workspaces (E11) |
| `team_members` | Workspace membership | Team Workspaces (E11) |
| `api_access_keys` | Programmatic API access keys | API Access (E14) |
| `model_changelog` | Model version history | Model Changelog (E17) |
| `response_cache` | Cached identical queries | Response Caching (E10) |
| `annotations` | User highlights on responses | Annotations (E19) |
| `audit_logs` | Security audit trail | Security (S7) |
| `user_roles` | Role-based access control | Security (S8) |

### New Database Functions

| Function | Purpose |
|---|---|
| `calculate_elo_rating(winner, loser, category)` | Bradley-Terry ELO calculation |
| `get_model_rankings(category, time_range)` | Leaderboard query with ELO |
| `get_battle_stats(model_id)` | Win/loss/draw stats per model |
| `get_trending_models(period)` | Models gaining/losing ranking |
| `has_role(user_id, role)` | SECURITY DEFINER role check |

---

## 11. EDGE FUNCTIONS NEEDED

| Function | Purpose | For Feature |
|---|---|---|
| `dml-battle` | 1v1 blind model battle orchestration | Battle Mode |
| `dml-elo-update` | Recalculate ELO ratings after votes | ELO System |
| `dml-vision-compare` | Image-based model comparison | Vision Arena |
| `dml-code-execute` | Sandbox code runner for generated code | Code Arena |
| `dml-api-gateway` | Public REST API proxy with key auth | API Access |
| `dml-benchmark-run` | Automated test suite execution | Benchmarking |
| `dml-cache-lookup` | Response cache check + serve | Caching |

---

## 12. QUALITY GATES

### Before Any PR Merges

```
✅ TypeScript strict: tsc --noEmit passes with ZERO errors
✅ ESLint: ZERO warnings or errors
✅ No `any` types anywhere in src/
✅ No console.log/error in src/ (only logger.*)
✅ No hardcoded route strings (use ROUTES constants)
✅ No raw import.meta.env (use validated config)
✅ All forms use React Hook Form + Zod
✅ All API data through TanStack Query
✅ All global state through Zustand stores
✅ Feature components use named exports
✅ Components < 150 lines of JSX
✅ DOMPurify on all user/AI rendered content
```

### Performance Targets

```
✅ Lighthouse Performance: 90+
✅ Lighthouse Accessibility: 90+
✅ LCP < 2.5s
✅ FID < 100ms
✅ CLS < 0.1
✅ Initial JS bundle: < 200KB gzipped
✅ Per-route chunk: < 100KB gzipped
```

### Testing Targets

```
✅ Utils: 95%+ coverage
✅ Hooks: 85%+ coverage
✅ Components: 70%+ coverage
✅ E2E: Auth flow, comparison flow, battle flow, payment flow
```

---

## DECISIONS PENDING (Awaiting User Input)

See clarifying questions in chat for decisions on:
1. Implementation priority (foundation fix vs new features)
2. Battle Mode UX approach
3. i18n languages
4. Testing strategy
5. Admin panel scope
6. Self-hosting target audience

---

*ENTERPRISE_PLAN v2.0 | 2026-03-08 | Based on SKILL.md v1.0.0*
