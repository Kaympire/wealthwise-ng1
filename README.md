# WealthWise NG — Personal Finance Management Automation

An AI-powered personal finance management platform for Nigeria, built as a portfolio project.

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Supabase** — auth + Postgres database
- **Tailwind CSS** — styling
- **n8n** — notifications & recurring automations (planned)
- **Anthropic Claude API** — AI transaction categorization & assistant (planned)
- **Mono / Okra** — Nigerian bank transaction sync (planned)

## Roadmap

1. Done - User authentication and profiles (Supabase Auth)
2. Next - Manual expense and income tracking
3. Bank API integration (Mono/Okra) for automatic transaction syncing
4. AI-powered transaction categorization
5. Budgeting, reporting, and dashboards
6. AI insights and conversational financial assistant
7. n8n workflows for notifications, savings, and recurring automations
8. Advanced features: receipt scanning, cash flow forecasting, financial goals

## Getting Started

1. Copy .env.local.example to .env.local and fill in your Supabase project
   credentials (Project Settings -> API in the Supabase dashboard).
2. Install dependencies:
   npm install
3. Run the dev server:
   npm run dev
4. Open http://localhost:3000

## Auth flow (Step 1 - current)

- /signup - create an account (email + password, sends confirmation email)
- /login - log in
- /auth/confirm - handles the email confirmation link from Supabase
- /dashboard - protected route, redirects to /login if not authenticated
- Middleware (src/middleware.ts) refreshes the Supabase session on every
  request and protects /dashboard/* routes.
