# 🗺️ OddsCast Feature Roadmap

> **AI-based horse racing prediction information service — feature plan & roadmap.**
>
> This document defines features to implement, services to enhance, and the
> overall product direction. It must be read before any planning/development
> session via `.cursorrules`.
>
> **Last updated**: 2026-02-19

---

## 0. Service Identity (Reminder)

| Principle | Detail |
|-----------|--------|
| **Core** | AI analysis content service — NOT a betting/gambling platform |
| **Revenue** | Subscription + individual ticket purchase + matrix ticket |
| **Users** | 40–60 age group, interested in horse racing analysis |
| **Legal** | Information service (like stock investment newsletters) |

---

## 1. Current Feature Status

### ✅ Implemented (Live)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | Race list (today / by date) | ✅ Done | Home, `/races` |
| 2 | Race detail (entries, results, preview) | ✅ Done | `/races/[id]` |
| 3 | AI prediction (preview + full) | ✅ Done | Preview free, full via ticket |
| 4 | Race results | ✅ Done | `/results` |
| 5 | Daily matrix guide (Yongsan-style) | ✅ Done | `/predictions/matrix` |
| 6 | Race schedule calendar | ✅ Done | `/races/schedule` |
| 7 | RACE ticket system | ✅ Done | Subscribe / purchase / points |
| 8 | MATRIX ticket system | ✅ Done | ₩1,000/ticket, 1 day = 1 ticket |
| 9 | Subscription plans (3 tiers) | ✅ Done | Light / Standard / Premium |
| 10 | Points system | ✅ Done | Purchase tickets with points |
| 11 | Ranking | ✅ Done | `/ranking` |
| 12 | Notifications | ✅ Done | Push (mobile), in-app |
| 13 | Profile / settings | ✅ Done | Edit, password, notification prefs |
| 14 | Auth (Google / email) | ✅ Done | JWT, Google OAuth |
| 15 | Legal pages | ✅ Done | Terms, privacy, refund |
| 16 | KRA data sync (cron) | ✅ Done | Plan, entry, results, backfill |
| 17 | Data consistency cron | ✅ Done | Orphaned race detection + backfill |
| 18 | Admin panel | ✅ Done | Users, AI config, sync, stats |

---

## 2. Short-term Roadmap (Phase 1 — 1–2 months)

### 2.1 🎯 Prediction Accuracy Dashboard

> Users need confidence. Show them how accurate the AI is.

| Item | Detail |
|------|--------|
| **What** | Public page showing AI prediction accuracy stats |
| **Metrics** | Overall hit rate, Top-3 accuracy, monthly trends, by-meet breakdown |
| **Route** | `/predictions/accuracy` |
| **Data source** | `Prediction.accuracy` field (already calculated on result confirmation) |
| **Priority** | ⭐⭐⭐ HIGH — builds user trust |

**Implementation plan:**
- Server: `GET /api/predictions/accuracy-stats` — aggregates from Prediction table
- WebApp: Page with charts (accuracy trend line, meet-by-meet bar chart)
- Components: `AccuracyCard`, `AccuracyTrendChart`, `MeetAccuracyTable`

---

### 2.2 🏇 Race Day Live Mode

> On race days (Fri/Sat/Sun), provide a real-time experience.

| Item | Detail |
|------|--------|
| **What** | Live race status indicator — upcoming / in-progress / finished |
| **Where** | Home page badge + race list status pills |
| **Data** | Race.status + scheduled start time (rcTime) + real-time result sync |
| **Priority** | ⭐⭐⭐ HIGH — engagement on race days |

**Implementation plan:**
- Enhance `DateHeader` with live countdown to next race
- Race card shows "Starting in 15 min" / "In Progress" / "Finished" badges
- Auto-refresh race list every 5 min on race days (react-query refetchInterval)
- Server: Existing real-time cron already syncs every 30 min on race days

---

### 2.3 📊 Horse Performance Profile

> Users want to research individual horses before checking AI predictions.

| Item | Detail |
|------|--------|
| **What** | Horse detail page — race history, win rate, form trend, rating change |
| **Route** | `/horses/[hrNo]` (linked from race detail entry list) |
| **Data** | Aggregated from `RaceEntry` + `RaceResult` by hrNo |
| **Priority** | ⭐⭐⭐ HIGH — core research tool for users |

**Implementation plan:**
- Server: `GET /api/horses/:hrNo/profile` — aggregates last 20 races, calculates stats
- Server: `GET /api/horses/:hrNo/history` — paginated race history
- WebApp: Horse profile card (name, age, sex, total races, win rate)
- WebApp: Form chart (last 10 races finishing position line graph)
- WebApp: Rating trend (if available from KRA data)

---

### 2.4 🏆 Jockey & Trainer Profiles

> Similar to horse profiles but for jockeys and trainers.

| Item | Detail |
|------|--------|
| **What** | Jockey/Trainer detail page — career stats, recent form, win rate |
| **Route** | `/jockeys/[jkNo]`, `/trainers/[trName]` |
| **Data** | From `RaceEntry` + `RaceResult` + `JockeyTotalResult` |
| **Priority** | ⭐⭐ MEDIUM |

**Implementation plan:**
- Server: `GET /api/jockeys/:jkNo/profile`, `GET /api/trainers/:name/profile`
- WebApp: Profile card + recent results table + meet-wise breakdown

---

### 2.5 🔔 Smart Race Alerts

> Proactive notifications about interesting races.

| Item | Detail |
|------|--------|
| **What** | Automated alerts: "High-confidence prediction ready", "Big race today" |
| **Trigger** | Cron after prediction generation — check confidence level |
| **Types** | `HIGH_CONFIDENCE` (accuracy > 70%), `BIG_RACE` (rank A or higher), `FIRST_RACE_SOON` |
| **Priority** | ⭐⭐ MEDIUM |

**Implementation plan:**
- Server: Post-prediction hook checks confidence score
- If above threshold, creates Notification for subscribed users
- Respects user notification preferences (raceEnabled, predictionEnabled)

---

## 3. Mid-term Roadmap (Phase 2 — 3–4 months)

### 3.1 📈 Prediction Comparison (Before vs After)

> Show how AI prediction matched actual results after race completion.

| Item | Detail |
|------|--------|
| **What** | Side-by-side view: AI's predicted top horses vs actual finishing order |
| **Where** | Race detail page — new tab "Prediction vs Result" |
| **Value** | Users see the AI's track record per race — builds long-term trust |
| **Priority** | ⭐⭐⭐ HIGH |

**Implementation plan:**
- Component: `PredictionResultComparison` — predicted rank ↔ actual rank
- Green highlight for correct predictions, red for misses
- "Hit rate for this race: X/3" badge
- Available only for COMPLETED races with both prediction and results

---

### 3.2 🧮 Custom Prediction Simulator

> Let users adjust weights and see how predictions change.

| Item | Detail |
|------|--------|
| **What** | Interactive tool: adjust rating/form/condition weights, see re-ranked horses |
| **Route** | `/races/[id]/simulator` |
| **Value** | Engagement tool — users feel like they're part of the analysis |
| **Priority** | ⭐⭐ MEDIUM |

**Implementation plan:**
- Client-side only (no server calls — use existing prediction scores)
- Sliders for 6 weight factors (rating, form, condition, experience, fitness, trainer)
- Real-time re-ranking as user adjusts weights
- "Reset to AI default" button
- Share button: "My custom prediction for Race #5"

---

### 3.3 📅 Weekly Preview Report

> A curated weekly summary of upcoming races and AI insights.

| Item | Detail |
|------|--------|
| **What** | Auto-generated weekly content: key races, horses to watch, trends |
| **Route** | `/weekly-preview` |
| **Generation** | Cron (Thursday evening) — Gemini generates weekly summary from upcoming race data |
| **Priority** | ⭐⭐ MEDIUM |

**Implementation plan:**
- Server: `WeeklyPreview` model or JSON config
- Cron: Thursday 20:00 — collects upcoming Fri/Sat/Sun races, generates Gemini summary
- WebApp: Card-based layout — "This Week's Highlights", "Horses to Watch", "Track Conditions"
- Free for all users (marketing/engagement tool)

---

### 3.4 📱 Push Notification Deep Links

> Tapping a push notification opens the relevant page.

| Item | Detail |
|------|--------|
| **What** | Push → opens specific race, prediction, or subscription page |
| **Platform** | Mobile (Expo push + deep link) |
| **Priority** | ⭐⭐ MEDIUM |

**Implementation plan:**
- Mobile: Configure Expo deep linking to webapp routes
- Server: Include `deepLink` field in push notification payload
- WebView: Handle `window.location` change on deep link reception

---

### 3.5 🎁 Referral & Promotion System

> Grow the user base through word-of-mouth.

| Item | Detail |
|------|--------|
| **What** | Referral codes: invite friend → both get bonus RACE tickets |
| **Reward** | Referrer: 3 RACE tickets, Referred: 2 RACE tickets |
| **Limit** | Max 10 referrals per user |
| **Priority** | ⭐⭐ MEDIUM |

**Implementation plan:**
- Server: `ReferralCode` model (userId, code, usedCount, maxUses)
- Server: `POST /api/referrals/claim` — validates code, grants tickets
- WebApp: `/profile` section with "My Referral Code" + share button
- Admin: Referral statistics dashboard

---

## 4. Long-term Roadmap (Phase 3 — 5–6 months)

### 4.1 🤝 Community Predictions (Social Feature)

> Users share their own predictions and compete.

| Item | Detail |
|------|--------|
| **What** | Users submit their top-3 prediction before race starts, compare with AI |
| **Scoring** | Points for correct predictions (similar to fantasy sports) |
| **Ranking** | Weekly/monthly community leaderboard |
| **Value** | Social engagement without gambling — pure prediction competition |
| **Priority** | ⭐ FUTURE |

**Key rules (no gambling):**
- No money involved — points only
- No horse/bet selection — just pick top 3 finishing order
- Results compared after race — leaderboard updated
- Monthly prizes: bonus RACE tickets for top predictors

---

### 4.2 📊 Advanced Analytics Dashboard

> Deep analytics for power users.

| Item | Detail |
|------|--------|
| **What** | Track-level stats, horse class migration, jockey-horse combo success rates |
| **Route** | `/analytics` |
| **Audience** | Subscribed users (premium content) |
| **Priority** | ⭐ FUTURE |

**Possible features:**
- Track condition impact analysis (firm vs soft)
- Distance specialty charts per horse
- Jockey-trainer combo win rates
- Post position (gate number) advantage by meet
- Weather impact on race outcomes

---

### 4.3 🌐 Multi-language Support

> Expand to international horse racing enthusiasts.

| Item | Detail |
|------|--------|
| **What** | English + Japanese language options |
| **Approach** | `next-intl` or `next-i18next` |
| **Priority** | ⭐ FUTURE |

---

### 4.4 🎙️ AI Race Commentary

> Real-time AI-generated commentary for each race.

| Item | Detail |
|------|--------|
| **What** | Race-by-race AI commentary — pre-race analysis + post-race review |
| **Format** | Text-based, card UI, auto-generated after results |
| **Tone** | Professional sports commentary style — exciting but informative |
| **Priority** | ⭐ FUTURE |

---

## 5. UX Enhancement Backlog

### 5.1 Onboarding Flow
- [ ] First-time user tutorial (swipe through key features)
- [ ] "Try a free prediction" — 1 complimentary RACE ticket on signup
- [ ] Tooltip hints on first visit to prediction matrix page

### 5.2 Personalization
- [ ] "Your recent races" section on home page
- [ ] Favorite meet filter saved per user
- [ ] Prediction history — "My past predictions" page

### 5.3 Content Quality
- [ ] Rich prediction cards with mini charts (bar chart of horse scores)
- [ ] Race replay links (external KRA video when available)
- [ ] Post-race analysis summary (Gemini-generated after results)

### 5.4 Performance
- [ ] ISR (Incremental Static Regeneration) for race list pages
- [ ] Image optimization for race/horse photos
- [ ] Lazy load prediction matrix rows

### 5.5 Accessibility
- [ ] High contrast mode (for 40–60 age users)
- [ ] Font size toggle (small / medium / large)
- [ ] Screen reader compatibility audit

---

## 6. Technical Debt & Infrastructure

| Item | Priority | Detail |
|------|----------|--------|
| Payment gateway integration | ⭐⭐⭐ HIGH | Real PG (Toss Payments / NicePay) for subscription & purchases |
| App Store deployment | ⭐⭐⭐ HIGH | iOS App Store + Google Play Store submission |
| Monitoring & alerting | ⭐⭐ MEDIUM | Sentry for errors, Uptime monitoring, API latency tracking |
| CI/CD pipeline | ⭐⭐ MEDIUM | GitHub Actions for test + build + deploy |
| Rate limiting | ⭐⭐ MEDIUM | Prevent API abuse, protect KRA sync endpoints |
| Database backups | ⭐⭐ MEDIUM | Automated daily PostgreSQL backups |
| Load testing | ⭐ LOW | Simulate race day traffic spikes |
| CDN for static assets | ⭐ LOW | CloudFront / Vercel Edge for webapp |

---

## 7. Priority Matrix

```
                    HIGH IMPACT
                        │
    ┌───────────────────┼───────────────────┐
    │                   │                   │
    │  Prediction       │  Horse Profile    │
    │  Accuracy Page    │  Page             │
    │                   │                   │
    │  Race Day Live    │  Prediction vs    │
    │  Mode             │  Result Compare   │
    │                   │                   │
LOW ├───────────────────┼───────────────────┤ HIGH
EFF │                   │                   │ EFFORT
ORT │  Smart Alerts     │  Custom Simulator │
    │                   │                   │
    │  Weekly Preview   │  Community        │
    │                   │  Predictions      │
    │  Deep Links       │                   │
    │                   │  Advanced         │
    │  Referral System  │  Analytics        │
    │                   │                   │
    └───────────────────┼───────────────────┘
                        │
                    LOW IMPACT
```

**Recommended execution order:**
1. Prediction Accuracy Dashboard (quick win, high trust)
2. Horse Performance Profile (core user need)
3. Race Day Live Mode (engagement)
4. Prediction vs Result Comparison (trust + engagement)
5. Jockey & Trainer Profiles (research completeness)
6. Weekly Preview Report (content marketing)
7. Smart Race Alerts (retention)
8. Referral System (growth)

---

## 8. Non-Feature Priorities

### 8.1 Content Strategy
- Regular AI accuracy reports (monthly transparency report)
- "How to read AI predictions" educational content
- Race day highlights (auto-generated post-race summary)

### 8.2 User Retention
- Daily login bonus (small point reward)
- Streak rewards (7-day consecutive login = 1 free RACE ticket)
- Push notification timing optimization (send 30 min before first race)

### 8.3 Trust Building
- Display AI model version and analysis methodology
- Show prediction confidence level per race (low / medium / high)
- Transparent accuracy tracking visible to all users

---

## 9. Document References

| Document | Relevance |
|----------|-----------|
| [SERVICE_SPECIFICATION.md](SERVICE_SPECIFICATION.md) | Current feature definitions |
| [BUSINESS_LOGIC.md](architecture/BUSINESS_LOGIC.md) | Business rules for new features |
| [API_SPECIFICATION.md](architecture/API_SPECIFICATION.md) | API endpoints to extend |
| [DATABASE_SCHEMA.md](architecture/DATABASE_SCHEMA.md) | Schema changes needed |
| [UI_PATTERNS.md](features/UI_PATTERNS.md) | Design patterns to follow |

---

_This document should be reviewed and updated at the start of each development sprint._
