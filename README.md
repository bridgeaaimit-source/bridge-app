# Team Pulse by Bridge AI — Enterprise HR Automation & Workforce Intelligence

**Team Pulse by Bridge AI** is a multi-tenant B2B enterprise HR SaaS web application built to automate recruitment, talent management, appraisal cycles, employee engagement, compliance, and workforce intelligence.

---

## 1. Architecture Overview

```
Bridge AI Platform
   │
   ├── Bridge AI Campus (Colleges, Students, Placement Officers)
   │
   └── Team Pulse by Bridge AI (/team-pulse)
          │
          ├── Rocket India (org_rocket_india)
          ├── Company A
          └── Company B
```

- **Frontend**: Next.js App Router (`app/team-pulse`), React 19, TailwindCSS, custom HSL enterprise design system.
- **Backend**: Next.js API Routes (`app/api/team-pulse`), RESTful conventions.
- **Database**: Prisma ORM with SQLite for zero-config local development (`dev.db`) and PostgreSQL support for production deployments.
- **Authentication**: JWT & HTTP-only session cookies with bcrypt password hashing and protected middleware.
- **AI Engine**: Server-side Anthropic Claude integration (`@anthropic-ai/sdk`) with deterministic fallback engines.

---

## 2. Modules Implemented

1. **HR Command Center** (`/team-pulse`) — Headcount growth, hiring funnel, flight risk, payroll metrics, morning briefing.
2. **Job Description Intelligence (JD Studio)** (`/team-pulse/jd-studio`) — Bias detection, skills extraction, structural checklist, AI rewrites.
3. **Candidate Sourcing** (`/team-pulse/sourcing`) — Boolean search string generator (LinkedIn/Naukri), candidate pipeline.
4. **Person–Job Fit** (`/team-pulse/job-fit`) — Multi-dimensional fit score (skills, experience, personality, retention), red flags.
5. **Structured Interviews** (`/team-pulse/interviews`) — Competency scorecards, hiring verdicts, AI summaries.
6. **Offer Studio** (`/team-pulse/offer-studio`) — Market benchmarking (P25/P50/P75), offer acceptance & joining probability, CTC breakup.
7. **Personality Lab** (`/team-pulse/personality-lab`) — 16-type MBTI distribution map, preference balance, manager coaching guides.
8. **Team Chemistry** (`/team-pulse/team-chemistry`) — Project team assembly, chemistry rating, style clash warnings.
9. **Performance & Promotions** (`/team-pulse/performance`) — 9-box talent matrix, promotion readiness ranking, PIP watchlist.
10. **Onboarding Studio** (`/team-pulse/onboarding`) — Pre-joining checklists, buddy match, 30-60-90 day roadmaps, welcome emails.
11. **Workforce Planner** (`/team-pulse/workforce-planner`) — 12-month growth scenarios, recruiting capacity, build/buy/borrow skill matrix.
12. **Internal Mobility** (`/team-pulse/internal-mobility`) — Match internal talent to open roles with reskilling paths.
13. **Attrition Radar** (`/team-pulse/attrition-radar`) — Flight risk scores, risk drivers breakdown, replacement vs fix-pay cost analysis.
14. **Engagement & Sentiment** (`/team-pulse/engagement`) — Happiness index by team, eNPS trend, burnout early warnings.
15. **Compliance Center** (`/team-pulse/compliance`) — POSH, Fire Safety, DPDP, statutory filing tracker.
16. **Fairness Audit** (`/team-pulse/fairness-audit`) — Four-fifths (80%) adverse impact ratio analysis across gender & age.
17. **HR Copilot** (`/team-pulse/copilot`) — Contextual AI chat assistant & quick HR document generator.

---

## 3. Local Setup Instructions

### Prerequisites
- Node.js v18+
- npm v9+

### Environment Configuration
Create or copy `.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="team-pulse-super-secret-jwt-key-2026"
ANTHROPIC_API_KEY="sk-ant-api03-..."
```

### Installation & Database Setup
```bash
# 1. Install dependencies
npm install

# 2. Push database schema to SQLite
npm run db:push

# 3. Generate Prisma client
npm run db:generate

# 4. Seed demo organization (Rocket India)
npm run db:seed

# 5. Start development server
npm run dev
```

---

## 4. Test Credentials (Development Only)

- **Organization**: Rocket India (`org_rocket_india`)
- **HR Admin**: `hr@rocketindia.com` / `password123`
- **Hiring Manager**: `manager@rocketindia.com` / `password123`
- **Super Admin**: `admin@bridgeai.com` / `admin123`

---

## 5. Deployment Instructions

1. Configure environment variables (`DATABASE_URL` pointing to PostgreSQL instance on Supabase/Neon/Render, `JWT_SECRET`, `ANTHROPIC_API_KEY`) on Vercel / hosting platform.
2. Build command: `npm run db:generate && npm run build`
3. Production start command: `npm run start`

---

## 6. Bridge AI Website Integration

Team Pulse is integrated into the Bridge AI homepage (`/`):
- Navigation menu link: `Team Pulse` -> `/team-pulse`
- Enterprise solutions card in `AudienceSegmentation` component linking to `/team-pulse`
