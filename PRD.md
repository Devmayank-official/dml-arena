# DML Arena - Product Requirements Document (PRD)

## Version 2.0 | February 2026

---

## 1. Executive Summary

### 1.1 Product Vision
DML Arena is a professional-grade AI model comparison platform that enables users to query multiple large language models (LLMs) simultaneously, compare their responses side-by-side, and determine which model performs best for specific use cases. The platform features real-time streaming responses, multi-round AI debates ("Deep Mode"), comprehensive export capabilities, and a community-driven leaderboard system.

### 1.2 Target Users
- AI researchers and developers evaluating model performance
- Business professionals selecting AI tools for specific workflows
- Content creators comparing writing assistance quality
- Students and educators exploring AI capabilities
- Technical teams conducting AI benchmarking

### 1.3 Core Value Proposition
- Single interface to compare 55+ AI models from 14 providers
- Real-time streaming with word-level diff highlighting
- Multi-round AI debates with synthesis capabilities
- Comprehensive rate limiting and fair usage policies
- Community voting and model leaderboards

---

## 2. Technical Architecture

### 2.1 Frontend Stack
```
+-------------------+
|    React 18.3     |
+-------------------+
         |
+-------------------+
|   Vite + TypeScript|
+-------------------+
         |
+-------------------+
| Tailwind CSS +    |
| Framer Motion     |
+-------------------+
         |
+-------------------+
|  Radix UI + shadcn |
+-------------------+
```

**Key Dependencies:**
- `@tanstack/react-query` - Server state management
- `framer-motion` - Animations and transitions
- `react-router-dom` - Client-side routing
- `react-markdown` + `remark-gfm` - Markdown rendering
- `react-syntax-highlighter` - Code block highlighting
- `recharts` - Data visualization
- `zod` - Schema validation
- `diff-match-patch` - Word-level diff computation

### 2.2 Backend Architecture
```
+----------------------------------+
|         Lovable Cloud            |
|  (Supabase-powered Backend)      |
+----------------------------------+
         |
+----------------------------------+
|       Edge Functions             |
| - compare-ai-stream (DML Arena)  |
| - deep-debate                    |
| - track-usage                    |
| - compare-ai (legacy)            |
+----------------------------------+
         |
+----------------------------------+
|     PostgreSQL Database          |
| - 11 Tables with RLS policies    |
+----------------------------------+
         |
+----------------------------------+
|    AI Gateway Layer              |
| - Lovable AI Gateway (primary)   |
| - OpenRouter (fallback/extended) |
| - Direct Provider APIs (user keys)|
+----------------------------------+
```

### 2.3 Database Schema

**Tables Overview:**

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `subscriptions` | User plan management | `plan`, `monthly_usage`, `usage_reset_at` |
| `profiles` | User profile data | `display_name`, `avatar_url`, `bio` |
| `comparison_history` | Saved comparisons | `query`, `responses`, `is_public` |
| `debate_history` | Deep Mode debates | `models`, `round_responses`, `final_answer` |
| `response_votes` | Upvote/downvote on models | `history_id`, `model_id`, `vote_type` |
| `response_ratings` | 1-5 star ratings | `history_id`, `model_id`, `rating` |
| `community_votes` | Community feed voting | `comparison_id`, `vote_type` |
| `shared_results` | Public share links | `share_code`, `history_id` |
| `user_favorites` | Bookmarked items | `comparison_id`, `debate_id` |
| `model_performance` | Performance metrics | `model_id`, `response_time_ms`, `success` |
| `usage_logs` | Rate limit tracking | `user_id`, `action_type`, `created_at` |

**Enums:**
- `subscription_plan`: `'free'` | `'pro'`

---

## 3. Feature Specifications

### 3.1 Authentication System

**Implementation:** `src/pages/Auth.tsx`, `src/hooks/useAuth.ts`

#### 3.1.1 Email/Password Authentication
```typescript
interface AuthFlow {
  signUp: (email: string, password: string) => Promise<{ error?: AuthError }>;
  signIn: (email: string, password: string) => Promise<{ error?: AuthError }>;
  signOut: () => Promise<{ error?: AuthError }>;
}
```

**Validation Rules:**
- Email: Valid email format (Zod validation)
- Password: Minimum 6 characters

**Error Handling:**
- "already registered" -> Suggest sign in
- "Invalid login credentials" -> Check email/password
- Generic errors -> Display raw message

#### 3.1.2 Google OAuth Authentication
```typescript
// Implementation via Lovable Cloud Auth
const handleGoogleSignIn = async () => {
  await lovable.auth.signInWithOAuth("google", {
    redirect_uri: window.location.origin,
  });
};
```

#### 3.1.3 Protected Routes
```typescript
// src/components/ProtectedRoute.tsx
// Redirects unauthenticated users to /auth
// Shows loading spinner during auth check
```

---

### 3.2 AI Model Comparison Engine

**Implementation:** `src/hooks/useStreamingComparison.ts`, `supabase/functions/compare-ai-stream/index.ts`

#### 3.2.1 Supported Models (55+ Total)

**System-Available Models (No API Key Required):**
| Provider | Models |
|----------|--------|
| OpenAI | GPT-5, GPT-5.1, GPT-5.2, GPT-5 Mini, GPT-5 Nano |
| Google | Gemini 2.5 Pro, Gemini 3 Pro Preview, Gemini 2.5 Flash, Gemini Flash Lite |

**OpenRouter Models (Requires OpenRouter Key):**
- Anthropic: Claude Sonnet 4.5, Claude Opus 4.5, Claude Opus 4, Claude Haiku 4.5, Claude 3.5 Sonnet, Claude 3 Opus
- DeepSeek: DeepSeek R1, DeepSeek V3.1, DeepSeek Prover V2
- Qwen: Qwen 3 Coder, Qwen 3 Max, Qwen 3 235B, QwQ 32B
- xAI: Grok 4, Grok 4 Thinking, Grok 4 Fast, Grok 3
- Zhipu: GLM 4.7, GLM 4.6 Flash, GLM 4.5
- Mistral: Mistral Large 2, Codestral, Devstral, Pixtral Large
- Meta: Llama 4 Maverick, Llama 4 Scout, Llama 3.3 70B
- Others: Moonshot Kimi K2, Cohere Command R+, NVIDIA Nemotron, AI21 Jamba, Amazon Nova

#### 3.2.2 Model Capabilities
```typescript
type ModelCapability = 'reasoning' | 'coding' | 'vision' | 'fast' | 'thinking';

interface AIModel {
  id: string;           // e.g., "openai/gpt-5"
  name: string;         // e.g., "GPT-5"
  provider: ModelProvider;
  description: string;
  color: string;        // HSL color for UI
  openRouterId: string; // Mapping to OpenRouter
  capabilities: ModelCapability[];
  contextLength?: string; // e.g., "128K"
  isNew?: boolean;
}
```

#### 3.2.3 Streaming Architecture
```typescript
// SSE Event Types
interface StreamEvent {
  type: 'start' | 'delta' | 'complete' | 'error';
  model: string;
  content?: string;      // For delta events
  duration?: number;     // For complete events
  tokens?: TokenUsage;   // For complete events
  error?: string;        // For error events
  apiKeySource?: 'user' | 'system';
}

// Client-side handling
const startComparison = async (
  message: string,
  models: string[],
  contextMessages: ContextMessage[] = []
) => {
  // 1. Create AbortController for cancellation
  // 2. POST to /functions/v1/compare-ai-stream
  // 3. Read SSE stream with TextDecoder
  // 4. Parse events and update UI state
  // 5. Handle errors and cleanup
};
```

#### 3.2.4 API Key Priority System
```
1. User's OpenRouter Key (all models)
   |
2. User's Provider-Specific Key (OpenAI, Anthropic, Google, Mistral, Groq)
   |
3. System OpenRouter Key (all models - if configured)
   |
4. Lovable AI Gateway (system models only)
```

#### 3.2.5 Multi-Turn Conversation Support
```typescript
interface ConversationTurn {
  id: string;
  query: string;
  responses: ModelResponse[];
  timestamp: Date;
}

// Context is built from previous turns:
// - User messages: query from each turn
// - Assistant messages: first successful response
```

---

### 3.3 Deep Mode (AI Debates)

**Implementation:** `src/hooks/useDeepDebate.ts`, `supabase/functions/deep-debate/index.ts`

#### 3.3.1 Debate Flow
```
+------------------+
|  User Query      |
+------------------+
        |
        v
+------------------+
| Round 1: Initial |
| Perspectives     |
| (All models)     |
+------------------+
        |
        v
+------------------+
| Rounds 2 to N:   |
| Refinement       |
| (Cross-reference)|
+------------------+
        |
        v
+------------------+
| Final Synthesis  |
| (Synthesizer     |
|  model)          |
+------------------+
```

#### 3.3.2 Deep Mode Settings
```typescript
interface DeepModeSettings {
  rounds: number;                    // 2-5 rounds
  style: DebateStyle;                // How models interact
  responseLength: ResponseLength;    // Output verbosity
  focusArea: FocusArea;              // Technical/Creative/etc.
  persona: ExpertPersona;            // Role-play prompts
  customPersona?: string;            // Free-form persona
  synthesizer: string;               // Model for final answer
}

type DebateStyle = 
  | 'collaborative'    // Build on others' ideas
  | 'competitive'      // Challenge weak arguments
  | 'analytical'       // Facts and data focus
  | 'socratic'         // Probing questions
  | 'devils_advocate'  // Argue against obvious
  | 'consensus';       // Find agreement

type ResponseLength = 'concise' | 'balanced' | 'detailed' | 'more_detailed';
type FocusArea = 'balanced' | 'technical' | 'creative' | 'practical' | 'theoretical';
type ExpertPersona = 'none' | 'scientist' | 'engineer' | 'philosopher' | 
                     'business' | 'educator' | 'critic' | 'custom';
```

#### 3.3.3 Presets
| Preset | Rounds | Style | Length | Focus | Persona |
|--------|--------|-------|--------|-------|---------|
| Quick | 2 | Collaborative | Concise | Balanced | None |
| Standard | 3 | Analytical | Balanced | Balanced | None |
| Deep | 5 | Competitive | Detailed | Technical | Scientist |

#### 3.3.4 Synthesis Prompt
```
System: You are a master synthesizer. You have witnessed a [style] debate.
Your task:
1. Identify the strongest arguments and insights from all rounds
2. Resolve any contradictions with the most logical conclusion
3. Present a comprehensive, well-structured final answer
4. Be clear about which model(s) contributed the key insights

Format your response as:
## Best Answer
[The synthesized answer]

## Key Contributors
[Which models provided the most valuable insights and why]
```

---

### 3.4 Rate Limiting System

**Implementation:** `supabase/functions/track-usage/index.ts`, `src/hooks/useSubscription.ts`

#### 3.4.1 Plan Limits
| Window | Free Plan | Pro Plan |
|--------|-----------|----------|
| Per Minute | 2 | 10 |
| Per Hour | 5 | 100 |
| Per Day | 5 | 300 |
| Per Month | 5 | 1,000 |
| Max Models/Comparison | 2 | 5 |

#### 3.4.2 Rate Check Flow
```
1. Frontend: Check hasReachedLimit (client-side cache)
   |
2. Call track-usage Edge Function
   |
3. Edge Function:
   a. Verify auth token
   b. Get user subscription
   c. FOR EACH window (minute, hour, day, month):
      - COUNT usage_logs WHERE user_id = user AND created_at >= window_start
      - Compare against plan limit
   d. IF any window exceeded:
      - Return 429 with exceeded window info
   e. ELSE:
      - INSERT into usage_logs
      - UPDATE subscriptions.monthly_usage
      - Return success with current limits
   |
4. Frontend: Update UI with rate limit status
```

#### 3.4.3 Rate Limit Response
```typescript
interface RateLimitResponse {
  success: boolean;
  plan: 'free' | 'pro';
  limits: RateLimitResult[];
  error?: string;
  exceededWindow?: string; // 'perMinute' | 'perHour' | 'perDay' | 'perMonth'
}

interface RateLimitResult {
  window: string;
  usage: number;
  limit: number;
  remaining: number;
  resetAt: string;  // ISO timestamp
  exceeded: boolean;
}
```

#### 3.4.4 User-Facing Messages
| Limit Hit | Message |
|-----------|---------|
| Per Minute | "Slow down! You've made too many requests. Try again in X seconds." |
| Per Hour | "Hourly limit reached. Resets in X minutes." |
| Per Day | "Daily limit reached. Resets at midnight." |
| Per Month | "Monthly limit reached. Upgrade to Pro for 1000 credits/month." |

---

### 3.5 Response Comparison Features

**Implementation:** `src/components/ResponseDiffView.tsx`, `src/lib/diffUtils.ts`

#### 3.5.1 View Modes
- **Grid View**: Responses in card grid (1-3 columns)
- **Compare View**: Side-by-side diff comparison

#### 3.5.2 Diff Features
```typescript
// Word-level diff computation
interface DiffSegment {
  type: 'equal' | 'insert' | 'delete';
  value: string;
}

function computeWordDiff(text1: string, text2: string): {
  left: DiffSegment[];
  right: DiffSegment[];
}

function getSimilarityPercentage(text1: string, text2: string): number;
```

#### 3.5.3 Comparison Modes
- **2-Way**: Compare any 2 models
- **3-Way**: Compare 3 models with cross-similarity percentages

#### 3.5.4 UI Controls
- Toggle diff highlighting (on/off)
- Sync scroll (link scroll positions)
- Export diff view as image

---

### 3.6 Export System

**Implementation:** `src/lib/exportUtils.ts`, `src/components/ExportDropdown.tsx`

#### 3.6.1 Supported Formats (11 Total)
| Category | Formats |
|----------|---------|
| Documents | PDF, Markdown (.md), Plain Text (.txt) |
| Data | JSON, YAML, XML, TOML, CSV, SQLite (.sql) |
| Code | Python (.py), JavaScript (.js) |

#### 3.6.2 Export Data Structure
```typescript
interface ExportData {
  query: string;
  responses: ModelResponse[];
  createdAt?: string;
  type?: 'comparison' | 'debate';
  debateRounds?: any[];
  finalAnswer?: string;
}
```

#### 3.6.3 Format-Specific Features
- **PDF**: Browser print dialog with styled HTML
- **Markdown**: Full formatting with model headers
- **JSON/YAML/XML**: Structured data with metadata
- **CSV**: Flat table with model, response, duration, tokens
- **SQLite**: CREATE TABLE + INSERT statements
- **Python/JS**: Executable scripts with data embedded

---

### 3.7 Sharing System

**Implementation:** `src/components/ShareButton.tsx`, `src/hooks/useHistory.ts`

#### 3.7.1 Share Flow
```
1. User clicks Share button
   |
2. Check if share already exists for history_id
   |
3. If not, INSERT into shared_results (auto-generates share_code)
   |
4. Return URL: {origin}/chat/share/{share_code}
   |
5. Display copy-to-clipboard dialog
```

#### 3.7.2 Share Code Generation
- Database-generated unique code
- Links are permanent (no expiration)
- Pro feature only

---

### 3.8 Community & Leaderboard

**Implementation:** `src/pages/Community.tsx`, `src/hooks/useLeaderboardData.ts`

#### 3.8.1 Community Feed
- Browse public comparisons
- Vote on comparisons (upvote/downvote)
- View comparison details

#### 3.8.2 Model Leaderboard
**Metrics:**
- Win Rate: Percentage of upvotes received
- Average Response Time: Mean duration in ms
- Total Responses: Count of comparisons featuring model
- Total Upvotes: Sum of positive votes

**Filters:**
- Time Range: All Time, This Month, This Week, Today
- Sort By: Win Rate, Response Time, Total Responses, Upvotes

#### 3.8.3 Performance Charts
- Win rate bar chart
- Response time comparison
- Usage distribution

---

### 3.9 User Settings & Profile

**Implementation:** `src/pages/Settings.tsx`, `src/hooks/useSettings.ts`

#### 3.9.1 User Settings (LocalStorage)
```typescript
interface UserSettings {
  defaultModels: string[];           // Pre-selected models
  responseDisplay: 'grid' | 'diff';  // Default view mode
  autoSaveHistory: boolean;          // Auto-save comparisons
}
```

#### 3.9.2 Profile Features
- Display name
- Avatar URL
- Bio
- View public comparisons

#### 3.9.3 Subscription Management
- View current plan (Free/Pro)
- Usage progress (monthly credits)
- Upgrade to Pro button
- Usage reset date

#### 3.9.4 API Keys Management
- OpenRouter API key
- OpenAI API key
- Anthropic API key
- Google API key
- Mistral API key
- Groq API key

#### 3.9.5 Data Management
- Export all data (JSON)
- Clear all history (with confirmation)

---

### 3.10 Logging System

**Implementation:** `src/lib/logger.ts`, `src/hooks/useLogger.ts`

#### 3.10.1 Log Levels
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
```

#### 3.10.2 Log Categories
```typescript
type LogCategory = 
  | 'auth'           // Authentication events
  | 'navigation'     // Route changes
  | 'comparison'     // Model comparisons
  | 'debate'         // Deep Mode events
  | 'api'            // API calls
  | 'rate_limit'     // Rate limit checks
  | 'subscription'   // Plan changes
  | 'user_action'    // User interactions
  | 'error'          // Errors
  | 'performance';   // Performance metrics
```

#### 3.10.3 Log Storage
- LocalStorage: `app_logs` key
- Max logs: 500 entries
- Auto-cleanup: Remove logs older than 24 hours

#### 3.10.4 Helper Methods
```typescript
logger.logAuth(action, data);
logger.logNavigation(from, to);
logger.logComparison(action, data);
logger.logDebate(action, data);
logger.logApiCall(endpoint, method, status, duration);
logger.logRateLimit(window, usage, limit, exceeded);
logger.logSubscription(action, plan);
logger.logUserAction(action, data);
logger.logPerformance(metric, value, unit);
logger.logError(error, context);
```

---

## 4. User Interface Components

### 4.1 Navigation Structure
```
/                   - Landing page (public)
/auth               - Sign in/up page (public)
/pricing            - Pricing page (public)
/chat               - Main comparison interface (protected)
/chat/community     - Community feed & leaderboard (protected)
/chat/community/:id - View specific comparison (protected)
/chat/profile/:id   - User profile (protected)
/chat/settings      - Settings page (protected)
/chat/history       - Comparison history (protected)
/chat/dashboard     - Usage dashboard (protected)
/chat/insights      - Performance insights (protected)
/chat/pinned        - Pinned responses (protected)
/chat/share/:code   - Shared result view (protected)
/install            - PWA installation guide (public)
```

### 4.2 Key Components

| Component | Purpose |
|-----------|---------|
| `AppLayout` | Main layout with sidebar and header |
| `AppSidebar` | Navigation sidebar (desktop) |
| `MobileNav` | Mobile hamburger menu with portal |
| `MobileBottomNav` | Mobile bottom navigation bar |
| `ModelSelector` | AI model selection grid |
| `ChatInput` | Query input with send button |
| `ResponseGrid` | Response cards in grid layout |
| `ResponseCard` | Individual model response |
| `ResponseDiffView` | Side-by-side comparison |
| `DeepModeToggle` | Deep Mode configuration |
| `DebateProgress` | Real-time debate progress |
| `UsageAlert` | Rate limit warning banner |
| `StreamingIndicator` | Loading indicator during stream |
| `ConversationThread` | Multi-turn conversation display |
| `ExportDropdown` | Format selection for export |
| `ShareButton` | Generate share link dialog |
| `CommandPalette` | Keyboard shortcut command palette |

### 4.3 Responsive Design

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile Adaptations:**
- Hamburger menu with portal rendering (fixes visibility issues)
- Bottom navigation bar
- Single-column response grid
- Touch-optimized buttons and inputs
- Swipe-to-close gesture on mobile menu

---

## 5. Subscription & Monetization

### 5.1 Plan Comparison

| Feature | Free | Pro ($15/mo) |
|---------|------|--------------|
| Monthly Credits | 5 | 1,000 |
| Rate Limits | 2/min, 5/hr | 10/min, 100/hr |
| Available Models | 2 (Nano, Lite) | 55+ (All) |
| Max Models/Query | 2 | 5 |
| Deep Mode | No | Yes |
| Community Access | No | Yes |
| Share Results | No | Yes |
| Export Results | No | Yes |
| Response History | Limited | Unlimited |
| Priority Support | No | Yes |

### 5.2 Free Plan Model Restrictions
Only these models available:
- `google/gemini-2.5-flash-lite`
- `openai/gpt-5-nano`

### 5.3 Subscription Triggers
- Profile and subscription records auto-created on signup via Supabase triggers

---

## 6. Security Considerations

### 6.1 Authentication
- Supabase Auth with email/password and Google OAuth
- Session management with JWT tokens
- Protected routes with redirect to /auth

### 6.2 Row Level Security (RLS)
All tables have RLS policies:
- Users can only read/write their own data
- Public comparisons/debates readable by all
- Service role for administrative operations

### 6.3 Rate Limiting
- Server-side enforcement (cannot be bypassed)
- Atomic check-and-increment operations
- Per-user tracking with `usage_logs` table

### 6.4 API Key Security
- User API keys stored in browser localStorage
- Keys transmitted to edge functions but not stored in database
- System keys stored in Deno environment variables

---

## 7. Performance Optimizations

### 7.1 Streaming Responses
- Server-Sent Events (SSE) for real-time updates
- Parallel model queries (Promise.all)
- AbortController for cancellation

### 7.2 State Management
- React Query for server state caching
- Local state for UI interactions
- LocalStorage for user preferences

### 7.3 Lazy Loading
- Dynamic imports for heavy components
- Intersection observer for infinite scroll (community feed)

### 7.4 Caching
- React Query default cache time
- LocalStorage for settings and logs

---

## 8. PWA Features

**Implementation:** `vite.config.ts`, `public/manifest.json`

### 8.1 Capabilities
- Install to home screen
- Offline indicator
- Service worker for caching
- Web push notifications (planned)

### 8.2 Manifest Configuration
```json
{
  "name": "DML Arena",
  "short_name": "DML Arena",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#000000"
}
```

---

## 9. File Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── community/          # Community-specific components
│   ├── leaderboard/        # Leaderboard components
│   ├── tour/               # Onboarding tour
│   └── [feature].tsx       # Feature components
├── hooks/
│   ├── useAuth.ts          # Authentication
│   ├── useSubscription.ts  # Plan management
│   ├── useStreamingComparison.ts  # AI comparison
│   ├── useDeepDebate.ts    # Deep Mode
│   ├── useHistory.ts       # Comparison history
│   ├── useSettings.ts      # User settings
│   ├── useLogger.ts        # Logging
│   └── [hook].ts           # Other hooks
├── lib/
│   ├── models.ts           # AI model definitions
│   ├── exportUtils.ts      # Export functions
│   ├── diffUtils.ts        # Diff computation
│   ├── logger.ts           # Logger class
│   └── utils.ts            # Utilities
├── pages/
│   ├── Index.tsx           # Main comparison page
│   ├── Auth.tsx            # Authentication
│   ├── Settings.tsx        # Settings
│   ├── Community.tsx       # Community/Leaderboard
│   ├── Pricing.tsx         # Pricing plans
│   └── [page].tsx          # Other pages
├── integrations/
│   ├── supabase/           # Supabase client & types
│   └── lovable/            # Lovable Cloud auth
└── types/
    └── index.ts            # Shared TypeScript types

supabase/
├── functions/
│   ├── compare-ai-stream/  # Streaming comparison
│   ├── deep-debate/        # Multi-round debates
│   ├── track-usage/        # Rate limiting
│   └── compare-ai/         # Legacy non-streaming
└── migrations/             # Database migrations
```

---

## 10. Glossary

| Term | Definition |
|------|------------|
| Comparison | Single query sent to multiple AI models with responses |
| Deep Mode | Multi-round AI debate feature with synthesis |
| Debate Round | One iteration where all models respond to a prompt |
| Synthesis | Final combined answer from synthesizer model |
| Rate Limit | Usage restrictions based on time windows |
| Credit | One query/comparison usage unit |
| Streaming | Real-time response delivery via SSE |
| Diff View | Side-by-side response comparison with highlighting |
| Win Rate | Percentage of upvotes a model receives |
| OpenRouter | Third-party API aggregating multiple AI providers |

---

## 11. Future Considerations

1. **Real-time Countdown Timers**: Tick-down seconds until rate limits reset
2. **Usage Log Cleanup Job**: Delete old logs (>30 days) to prevent table bloat
3. **IP-Based Rate Limiting**: Fallback for unauthenticated requests
4. **Apple Sign-In**: Additional OAuth provider
5. **Voice Input Enhancement**: Full voice-to-text query support
6. **Model Favoriting**: Quick access to frequently used models
7. **Custom Presets**: User-defined Deep Mode configurations
8. **Webhook Integrations**: Notify external services on comparison complete
9. **Team/Workspace Features**: Shared history for teams
10. **API Access**: Programmatic access to comparison features
