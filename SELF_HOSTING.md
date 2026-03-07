# 🚀 DML Arena — Self-Hosting Guide

> **Complete guide to deploy DML Arena on your own infrastructure.**
> Covers Vercel, Netlify, Docker, and self-hosted Supabase configurations.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Option A: Vercel + Supabase Cloud](#option-a-vercel--supabase-cloud)
4. [Option B: Netlify + Supabase Cloud](#option-b-netlify--supabase-cloud)
5. [Option C: Docker + Self-Hosted Supabase](#option-c-docker--self-hosted-supabase)
6. [Database Schema (Full SQL)](#database-schema-full-sql)
7. [Row-Level Security (RLS) Policies](#row-level-security-rls-policies)
8. [Database Functions & Triggers](#database-functions--triggers)
9. [Edge Functions](#edge-functions)
10. [Secrets & Environment Variables](#secrets--environment-variables)
11. [Storage Buckets](#storage-buckets)
12. [Razorpay Payment Integration](#razorpay-payment-integration)
13. [OpenRouter API Setup](#openrouter-api-setup)
14. [Automated Setup Script](#automated-setup-script)
15. [Post-Deployment Checklist](#post-deployment-checklist)
16. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | ≥ 18.x | Build & run frontend |
| **npm / bun** | Latest | Package manager |
| **Git** | Latest | Clone repository |
| **Supabase CLI** | ≥ 1.100 | Deploy edge functions & run migrations |
| **Docker** (Option C only) | ≥ 24.x | Self-hosted Supabase |
| **Docker Compose** (Option C only) | ≥ 2.x | Orchestrate containers |

### Required Accounts (Cloud Options)

- [Supabase](https://supabase.com) — Free tier available
- [Vercel](https://vercel.com) or [Netlify](https://netlify.com) — Free tier available
- [OpenRouter](https://openrouter.ai) — For 55+ AI model access
- [Razorpay](https://razorpay.com) — Payment gateway (optional, India-focused)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)             │
│  Vercel / Netlify / Docker Nginx                      │
│  • React 18 + TypeScript + Tailwind CSS               │
│  • shadcn/ui components                               │
│  • PWA with Service Worker                            │
│  • Framer Motion animations                           │
└─────────────────────┬────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼────────────────────────────────┐
│                 SUPABASE BACKEND                      │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │  PostgreSQL  │  │Edge Functions│  │   Auth       │  │
│  │  (11 tables) │  │ (7 functions)│  │  (Email/PWD) │  │
│  └─────────────┘  └──────────────┘  └─────────────┘  │
│  ┌─────────────┐  ┌──────────────┐                    │
│  │  Storage     │  │  Realtime    │                    │
│  │  (avatars)   │  │  (optional)  │                    │
│  └─────────────┘  └──────────────┘                    │
└─────────────────────┬────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────┐
│              EXTERNAL APIs                            │
│  • OpenRouter (55+ AI models)                         │
│  • Lovable AI Gateway (fallback for base models)      │
│  • Razorpay (payments)                                │
└──────────────────────────────────────────────────────┘
```

---

## Option A: Vercel + Supabase Cloud

### 1. Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project** → choose a region close to your users
3. Save your **Project URL**, **Anon Key**, and **Service Role Key**

### 2. Run Database Setup

Run the full SQL from [Database Schema](#database-schema-full-sql) in **Supabase Dashboard → SQL Editor**.

### 3. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login & link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all edge functions
supabase functions deploy dml-arena
supabase functions deploy dml-arena-stream
supabase functions deploy dml-debate
supabase functions deploy dml-track-usage
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-verify-payment
supabase functions deploy razorpay-webhook
supabase functions deploy razorpay-cancel-subscription
```

### 4. Set Secrets

```bash
supabase secrets set LOVABLE_API_KEY=your_lovable_key
supabase secrets set OPENROUTER_API_KEY=your_openrouter_key
supabase secrets set RAZORPAY_KEY_ID=rzp_live_XXXX
supabase secrets set RAZORPAY_KEY_SECRET=XXXX
supabase secrets set RAZORPAY_WEBHOOK_SECRET=XXXX
```

### 5. Deploy Frontend to Vercel

```bash
# Clone the repo
git clone https://github.com/your-org/dml-arena.git
cd dml-arena

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_RAZORPAY_KEY_ID="rzp_live_XXXX"
EOF

# Deploy
npx vercel --prod
```

In **Vercel Dashboard → Settings → Environment Variables**, add the same `VITE_*` variables.

---

## Option B: Netlify + Supabase Cloud

Steps 1–4 are identical to [Option A](#option-a-vercel--supabase-cloud).

### 5. Deploy Frontend to Netlify

```bash
# Build
npm run build

# Create netlify.toml
cat > netlify.toml << 'EOF'
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF

# Deploy
npx netlify-cli deploy --prod --dir=dist
```

Add environment variables in **Netlify Dashboard → Site Settings → Environment Variables**.

---

## Option C: Docker + Self-Hosted Supabase

### 1. Self-Host Supabase

```bash
# Clone Supabase Docker setup
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Copy environment template
cp .env.example .env

# Edit .env — set these critical values:
# POSTGRES_PASSWORD=your-secure-password
# JWT_SECRET=your-jwt-secret-min-32-chars
# ANON_KEY=generate-with-jwt-secret
# SERVICE_ROLE_KEY=generate-with-jwt-secret
# DASHBOARD_USERNAME=admin
# DASHBOARD_PASSWORD=your-dashboard-password
# SITE_URL=https://your-domain.com

# Start Supabase
docker compose up -d
```

Generate JWT keys:
```bash
# Generate ANON_KEY (role: anon, iss: supabase)
node -e "
const jwt = require('jsonwebtoken');
const secret = 'your-jwt-secret-min-32-chars';
console.log('ANON_KEY:', jwt.sign({ role: 'anon', iss: 'supabase' }, secret, { expiresIn: '10y' }));
console.log('SERVICE_ROLE_KEY:', jwt.sign({ role: 'service_role', iss: 'supabase' }, secret, { expiresIn: '10y' }));
"
```

### 2. Run Database Migrations

Connect to your self-hosted PostgreSQL and run the full SQL from [Database Schema](#database-schema-full-sql).

### 3. Deploy Edge Functions (Deno)

For self-hosted Supabase, edge functions run via the `supabase-edge-runtime` container.

```bash
# Copy edge functions to the functions volume
cp -r supabase/functions/* /path/to/supabase/docker/volumes/functions/

# Restart the edge runtime
docker compose restart functions
```

### 4. Build & Serve Frontend

```dockerfile
# Dockerfile for DML Arena Frontend
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_SUPABASE_PROJECT_ID
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_URL
ARG VITE_RAZORPAY_KEY_ID
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# nginx.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

```yaml
# docker-compose.yml (frontend)
version: '3.8'
services:
  dml-arena:
    build:
      context: .
      args:
        VITE_SUPABASE_PROJECT_ID: "your-project-id"
        VITE_SUPABASE_PUBLISHABLE_KEY: "your-anon-key"
        VITE_SUPABASE_URL: "https://your-supabase-domain.com"
        VITE_RAZORPAY_KEY_ID: "rzp_live_XXXX"
    ports:
      - "3000:80"
    restart: unless-stopped
```

```bash
docker compose up -d --build
```

---

## Database Schema (Full SQL)

Run this **in order** in your Supabase SQL Editor or directly against PostgreSQL.

```sql
-- =============================================
-- DML Arena — Complete Database Schema
-- =============================================

-- 1. ENUMS
-- =============================================
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro');


-- 2. TABLES
-- =============================================

-- 2.1 Profiles
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    display_name text,
    avatar_url text,
    bio text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.2 Subscriptions
CREATE TABLE public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    plan subscription_plan NOT NULL DEFAULT 'free',
    monthly_usage integer NOT NULL DEFAULT 0,
    usage_reset_at timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
    subscription_start timestamptz,
    subscription_end timestamptz,
    cancelled_at timestamptz,
    razorpay_subscription_id text,
    billing_cycle text DEFAULT 'monthly',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.3 Comparison History
CREATE TABLE public.comparison_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    query text NOT NULL,
    responses jsonb NOT NULL,
    category text,
    is_public boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.4 Debate History
CREATE TABLE public.debate_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    query text NOT NULL,
    models text[] NOT NULL,
    settings jsonb NOT NULL,
    round_responses jsonb NOT NULL,
    total_rounds integer NOT NULL,
    elapsed_time integer NOT NULL,
    final_answer text,
    is_public boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.5 User Favorites
CREATE TABLE public.user_favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    comparison_id uuid REFERENCES public.comparison_history(id),
    debate_id uuid REFERENCES public.debate_history(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.6 Community Votes
CREATE TABLE public.community_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_id uuid NOT NULL REFERENCES public.comparison_history(id),
    user_id uuid NOT NULL,
    vote_type text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.7 Response Votes
CREATE TABLE public.response_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    history_id uuid NOT NULL,
    history_type text NOT NULL,
    model_id text NOT NULL,
    user_id uuid,
    vote_type text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.8 Response Ratings
CREATE TABLE public.response_ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    history_id uuid NOT NULL,
    history_type text NOT NULL,
    model_id text NOT NULL,
    rating integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.9 Model Performance
CREATE TABLE public.model_performance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    model_id text NOT NULL,
    response_time_ms integer NOT NULL,
    tokens_used integer,
    success boolean NOT NULL DEFAULT true,
    query_category text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.10 Shared Results
CREATE TABLE public.shared_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    history_id uuid NOT NULL,
    history_type text NOT NULL,
    share_code text NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
    user_id uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2.11 Payments
CREATE TABLE public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    currency text NOT NULL DEFAULT 'INR',
    status text NOT NULL DEFAULT 'created',
    razorpay_order_id text,
    razorpay_payment_id text,
    razorpay_subscription_id text,
    billing_cycle text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2.12 Usage Logs
CREATE TABLE public.usage_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    action_type text NOT NULL DEFAULT 'comparison',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient rate limiting queries
CREATE INDEX idx_usage_logs_user_created 
    ON public.usage_logs (user_id, created_at DESC);
```

---

## Row-Level Security (RLS) Policies

```sql
-- =============================================
-- Enable RLS on ALL tables
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES
-- =============================================
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- SUBSCRIPTIONS
-- =============================================
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- COMPARISON HISTORY
-- =============================================
CREATE POLICY "Users can insert own comparison history" ON public.comparison_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own or public comparison history" ON public.comparison_history
    FOR SELECT USING ((auth.uid() = user_id) OR (is_public = true));

CREATE POLICY "Users can update own comparison history" ON public.comparison_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comparison history" ON public.comparison_history
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- DEBATE HISTORY
-- =============================================
CREATE POLICY "Users can insert own debate history" ON public.debate_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own or public debate history" ON public.debate_history
    FOR SELECT USING ((auth.uid() = user_id) OR (is_public = true));

CREATE POLICY "Users can update own debate history" ON public.debate_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own debate history" ON public.debate_history
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- USER FAVORITES
-- =============================================
CREATE POLICY "Users can view their own favorites" ON public.user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites" ON public.user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON public.user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- COMMUNITY VOTES
-- =============================================
CREATE POLICY "Anyone can read community votes" ON public.community_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.community_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON public.community_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.community_votes
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- RESPONSE VOTES
-- =============================================
CREATE POLICY "Users can view their own votes" ON public.response_votes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own votes" ON public.response_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON public.response_votes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON public.response_votes
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- RESPONSE RATINGS
-- =============================================
CREATE POLICY "Users can view their own ratings" ON public.response_ratings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ratings" ON public.response_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings" ON public.response_ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings" ON public.response_ratings
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- MODEL PERFORMANCE
-- =============================================
CREATE POLICY "Users can view their own performance data" ON public.model_performance
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance data" ON public.model_performance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- SHARED RESULTS
-- =============================================
CREATE POLICY "Anyone can read shared results" ON public.shared_results
    FOR SELECT USING (true);

CREATE POLICY "Pro users can share" ON public.shared_results
    FOR INSERT WITH CHECK (
        (auth.uid() IS NOT NULL) AND 
        (EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE subscriptions.user_id = auth.uid() 
            AND subscriptions.plan = 'pro'
        ))
    );

-- =============================================
-- PAYMENTS
-- =============================================
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payments" ON public.payments
    FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- USAGE LOGS
-- =============================================
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs" ON public.usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

---

## Database Functions & Triggers

```sql
-- =============================================
-- FUNCTION: Auto-update updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- =============================================
-- FUNCTION: Handle new user signup
-- Creates profile + free subscription automatically
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, display_name)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
    );
    
    INSERT INTO public.subscriptions (user_id, plan)
    VALUES (NEW.id, 'free');
    
    RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGER: Auto-create profile on signup
-- =============================================
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TRIGGER: Auto-update updated_at on profiles
-- =============================================
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TRIGGER: Auto-update updated_at on subscriptions
-- =============================================
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TRIGGER: Auto-update updated_at on payments
-- =============================================
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- TRIGGER: Auto-update updated_at on response_ratings
-- =============================================
CREATE TRIGGER update_response_ratings_updated_at
    BEFORE UPDATE ON public.response_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

---

## Edge Functions

DML Arena uses **7 Supabase Edge Functions** (Deno runtime):

| Function | JWT Verify | Purpose |
|----------|-----------|---------|
| `dml-arena` | ❌ (public) | Legacy non-streaming model comparison |
| `dml-arena-stream` | ❌ (validates in code) | Primary streaming comparison engine |
| `dml-debate` | ❌ (validates in code) | Deep Mode multi-round AI debate |
| `dml-track-usage` | ❌ (validates in code) | Rate limiting & usage tracking |
| `razorpay-create-order` | ❌ | Create Razorpay payment orders |
| `razorpay-verify-payment` | ❌ | Verify payment signatures |
| `razorpay-webhook` | ❌ | Handle Razorpay webhook events |
| `razorpay-cancel-subscription` | ❌ | Cancel Pro subscriptions |

### Edge Function Config (`supabase/config.toml`)

```toml
[functions.razorpay-create-order]
verify_jwt = false

[functions.razorpay-verify-payment]
verify_jwt = false

[functions.razorpay-webhook]
verify_jwt = false

[functions.razorpay-cancel-subscription]
verify_jwt = false
```

> **Note:** `dml-arena`, `dml-arena-stream`, `dml-debate`, and `dml-track-usage` handle JWT verification internally via `supabase.auth.getUser()` or `supabase.auth.getClaims()`.

### Deploying Edge Functions

```bash
# Deploy all at once
supabase functions deploy dml-arena
supabase functions deploy dml-arena-stream
supabase functions deploy dml-debate
supabase functions deploy dml-track-usage
supabase functions deploy razorpay-create-order
supabase functions deploy razorpay-verify-payment
supabase functions deploy razorpay-webhook
supabase functions deploy razorpay-cancel-subscription
```

---

## Secrets & Environment Variables

### Frontend Environment Variables (`.env`)

These are **public/publishable** and safe to include in builds:

```bash
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_RAZORPAY_KEY_ID="rzp_live_XXXX"  # Publishable key only
```

### Backend Secrets (Supabase Edge Function Env)

These are **private** and must be set via `supabase secrets set`:

| Secret | Required | Source | Purpose |
|--------|----------|--------|---------|
| `SUPABASE_URL` | ✅ Auto | Supabase | API base URL |
| `SUPABASE_ANON_KEY` | ✅ Auto | Supabase | Anonymous client key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Auto | Supabase | Admin operations (bypasses RLS) |
| `LOVABLE_API_KEY` | ⚠️ Optional | Lovable | Fallback AI gateway (base models only) |
| `OPENROUTER_API_KEY` | ✅ Recommended | [openrouter.ai](https://openrouter.ai) | Access 55+ AI models |
| `RAZORPAY_KEY_ID` | ⚠️ Optional | [razorpay.com](https://razorpay.com) | Payment Key ID |
| `RAZORPAY_KEY_SECRET` | ⚠️ Optional | [razorpay.com](https://razorpay.com) | Payment Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | ⚠️ Optional | [razorpay.com](https://razorpay.com) | Webhook signature verification |

```bash
# Set all secrets at once
supabase secrets set \
  OPENROUTER_API_KEY=sk-or-v1-XXXX \
  RAZORPAY_KEY_ID=rzp_live_XXXX \
  RAZORPAY_KEY_SECRET=XXXX \
  RAZORPAY_WEBHOOK_SECRET=XXXX
```

> **Important:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are automatically available in Supabase-hosted edge functions. For self-hosted setups, set them manually.

---

## Storage Buckets

```sql
-- Create the avatars bucket (public access for profile images)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- RLS: Anyone can view avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- RLS: Users can upload their own avatar
CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- RLS: Users can update their own avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- RLS: Users can delete their own avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
```

---

## Razorpay Payment Integration

### Setup Steps

1. **Create Razorpay Account** at [dashboard.razorpay.com](https://dashboard.razorpay.com)
2. **Generate API Keys**: Dashboard → Settings → API Keys
3. **Configure Webhook**:
   - URL: `https://YOUR_PROJECT_ID.supabase.co/functions/v1/razorpay-webhook`
   - Events to subscribe:
     - `payment.captured`
     - `payment.failed`
     - `order.paid`
     - `subscription.charged`
     - `subscription.halted`
     - `subscription.cancelled`
     - `refund.processed`
4. **Set Secrets** (see [Secrets section](#secrets--environment-variables))

### Pricing Configuration

Defined in `razorpay-create-order/index.ts`:

| Plan | Monthly | Yearly (15% off) |
|------|---------|-------------------|
| Pro | ₹1,500 | ₹15,300 |

### Rate Limits by Plan

Defined in `dml-track-usage/index.ts`:

| Window | Free | Pro |
|--------|------|-----|
| Per Minute | 2 | 10 |
| Per Hour | 5 | 100 |
| Per Day | 5 | 300 |
| Per Month | 5 | 1,000 |

---

## OpenRouter API Setup

DML Arena uses [OpenRouter](https://openrouter.ai) to access 55+ AI models from multiple providers.

### Setup

1. Create account at [openrouter.ai](https://openrouter.ai)
2. Generate API key at [openrouter.ai/keys](https://openrouter.ai/keys)
3. Add credits to your account
4. Set the secret: `supabase secrets set OPENROUTER_API_KEY=sk-or-v1-XXXX`

### Model Routing Priority

The `dml-arena-stream` edge function routes model requests in this priority:

1. **User's OpenRouter key** (from Settings → API Keys)
2. **User's provider-specific key** (e.g., OpenAI, Anthropic)
3. **System OpenRouter key** (`OPENROUTER_API_KEY` secret)
4. **Lovable AI Gateway** (fallback, limited to ~9 base models)

### Supported Providers & Models

| Provider | Models | Notes |
|----------|--------|-------|
| OpenAI | GPT-5, GPT-5.1, GPT-5.2, GPT-5-mini, GPT-5-nano, GPT-OSS series, O1, O3-mini, GPT-4.1 | |
| Google | Gemini 2.5 Pro/Flash/Flash-Lite, Gemini 3 Pro Preview | |
| Anthropic | Claude Sonnet 4.5, Opus 4.5, Opus 4, Haiku 4.5, 3.5 Sonnet, 3 Opus | |
| DeepSeek | R1, R1-0528, V3.1, V3, R1-Distill-70B, Prover V2 | |
| Qwen | Qwen3-Coder, Qwen3-Max, Qwen3-235B, Qwen3-Thinking, Qwen-2.5-72B, QwQ-32B | |
| xAI | Grok 4, Grok 4-Thinking, Grok 4-Fast, Grok 3, Grok 2 Vision | |
| Meta | Llama 4 Maverick/Scout, Llama 3.3 70B, Llama 3.1 405B, Llama 3.2 90B Vision | |
| Mistral | Large 2, Medium 3.1, Codestral, Devstral, Pixtral Large, Ministral 8B | |
| Zhipu | GLM-4.7, GLM-4.6-Flash, GLM-4.5, GLM-4-Long | |
| Moonshot | Kimi K2, Kimi K2-Thinking, Kimi VL | |
| Cohere | Command R+, Command A | |
| NVIDIA | Llama 3.1 Nemotron 70B | |
| AI21 | Jamba 1.6 Large | |
| Amazon | Nova Pro, Nova Lite | |

---

## Automated Setup Script

Save as `setup.sh` and run with `bash setup.sh`:

```bash
#!/bin/bash
set -euo pipefail

# =============================================
# DML Arena — Automated Self-Hosting Setup
# =============================================

echo "🚀 DML Arena Self-Hosting Setup"
echo "================================"

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js required. Install from https://nodejs.org"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm required."; exit 1; }
command -v supabase >/dev/null 2>&1 || { echo "❌ Supabase CLI required. Run: npm install -g supabase"; exit 1; }

# Gather configuration
echo ""
read -p "Supabase Project Ref (e.g., abcdefghijkl): " PROJECT_REF
read -p "Supabase URL (e.g., https://abcdefghijkl.supabase.co): " SUPABASE_URL
read -p "Supabase Anon Key: " ANON_KEY
read -p "OpenRouter API Key (or press Enter to skip): " OPENROUTER_KEY
read -p "Razorpay Key ID (or press Enter to skip): " RAZORPAY_KEY_ID
read -p "Razorpay Key Secret (or press Enter to skip): " RAZORPAY_KEY_SECRET
read -p "Razorpay Webhook Secret (or press Enter to skip): " RAZORPAY_WEBHOOK_SECRET

# Step 1: Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Step 2: Create .env file
echo ""
echo "📝 Creating .env file..."
cat > .env << EOF
VITE_SUPABASE_PROJECT_ID="${PROJECT_REF}"
VITE_SUPABASE_PUBLISHABLE_KEY="${ANON_KEY}"
VITE_SUPABASE_URL="${SUPABASE_URL}"
EOF

if [ -n "${RAZORPAY_KEY_ID}" ]; then
    echo "VITE_RAZORPAY_KEY_ID=\"${RAZORPAY_KEY_ID}\"" >> .env
fi

# Step 3: Link Supabase project
echo ""
echo "🔗 Linking Supabase project..."
supabase link --project-ref "${PROJECT_REF}"

# Step 4: Deploy edge functions
echo ""
echo "⚡ Deploying edge functions..."
FUNCTIONS=(
    "dml-arena"
    "dml-arena-stream"
    "dml-debate"
    "dml-track-usage"
    "razorpay-create-order"
    "razorpay-verify-payment"
    "razorpay-webhook"
    "razorpay-cancel-subscription"
)

for fn in "${FUNCTIONS[@]}"; do
    echo "  Deploying ${fn}..."
    supabase functions deploy "${fn}" --no-verify-jwt 2>/dev/null || \
    supabase functions deploy "${fn}" 2>/dev/null || \
    echo "  ⚠️  Failed to deploy ${fn} (may need config.toml update)"
done

# Step 5: Set secrets
echo ""
echo "🔐 Setting secrets..."
if [ -n "${OPENROUTER_KEY}" ]; then
    supabase secrets set OPENROUTER_API_KEY="${OPENROUTER_KEY}"
    echo "  ✅ OPENROUTER_API_KEY set"
fi

if [ -n "${RAZORPAY_KEY_ID}" ]; then
    supabase secrets set RAZORPAY_KEY_ID="${RAZORPAY_KEY_ID}"
    echo "  ✅ RAZORPAY_KEY_ID set"
fi

if [ -n "${RAZORPAY_KEY_SECRET}" ]; then
    supabase secrets set RAZORPAY_KEY_SECRET="${RAZORPAY_KEY_SECRET}"
    echo "  ✅ RAZORPAY_KEY_SECRET set"
fi

if [ -n "${RAZORPAY_WEBHOOK_SECRET}" ]; then
    supabase secrets set RAZORPAY_WEBHOOK_SECRET="${RAZORPAY_WEBHOOK_SECRET}"
    echo "  ✅ RAZORPAY_WEBHOOK_SECRET set"
fi

# Step 6: Build frontend
echo ""
echo "🏗️  Building frontend..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run the database SQL from SELF_HOSTING.md in your Supabase SQL Editor"
echo "  2. Deploy the 'dist/' folder to your hosting provider"
echo "  3. Configure Razorpay webhook URL (if using payments)"
echo "  4. Test: npm run preview"
echo ""
echo "📖 Full guide: SELF_HOSTING.md"
```

Make executable: `chmod +x setup.sh`

---

## Post-Deployment Checklist

- [ ] **Database**: All 12 tables created with correct schemas
- [ ] **RLS**: All tables have RLS enabled with correct policies
- [ ] **Functions**: `handle_new_user` trigger on `auth.users` is active
- [ ] **Triggers**: `updated_at` triggers on profiles, subscriptions, payments, response_ratings
- [ ] **Edge Functions**: All 8 functions deployed and responding
- [ ] **Secrets**: `OPENROUTER_API_KEY` set (required for 55+ models)
- [ ] **Storage**: `avatars` bucket created with public read access
- [ ] **Auth**: Email/password authentication enabled
- [ ] **Frontend**: `.env` configured with correct Supabase credentials
- [ ] **CORS**: Edge functions return correct CORS headers
- [ ] **Webhook**: Razorpay webhook URL configured (if using payments)
- [ ] **PWA**: `manifest.json` and service worker generating correctly
- [ ] **SSL**: HTTPS configured for production domain
- [ ] **DNS**: Custom domain pointed to hosting provider

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Authentication required" errors | Check `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` matches your Supabase anon key |
| Edge functions return 500 | Check `supabase functions logs <function-name>` for errors |
| Models not responding | Verify `OPENROUTER_API_KEY` is set and has credits |
| Payments failing | Ensure all 3 Razorpay secrets are set correctly |
| "Subscription not found" | Verify the `handle_new_user` trigger is active on `auth.users` |
| Avatar upload fails | Check `avatars` storage bucket exists and has correct RLS policies |
| RLS blocking queries | Use `supabase inspect db policies` to audit policies |
| Edge function CORS errors | Ensure all functions return `Access-Control-Allow-Origin: *` header |

### Useful Commands

```bash
# Check edge function logs
supabase functions logs dml-arena-stream --tail

# List all secrets
supabase secrets list

# Check database status
supabase db lint

# Reset database (⚠️ destroys all data)
supabase db reset

# Test edge function locally
supabase functions serve dml-arena-stream --no-verify-jwt
```

---

## License

DML Arena is developed by **DML Labs**.  
Lead Engineer: [devmayank-official](https://github.com/devmayank-official)

---

*Last updated: March 2026*
