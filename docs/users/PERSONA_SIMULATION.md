# User Persona Simulation

> OddsCast target audience (40-60) persona-based user journey simulation.
> Identifies UX friction points, conversion opportunities, and retention risks.

**Last updated:** 2026-03-23

---

## Persona 1: "Steady Kim" — Regular Racing Fan (55, Male)

### Profile
| Item | Detail |
|------|--------|
| Age | 55 |
| Occupation | Small business owner (restaurant) |
| Tech literacy | Medium — uses KakaoTalk, Naver, basic smartphone |
| Racing experience | 15+ years, goes to Seoul racecourse every weekend |
| Current habit | Buys paper racing guide (2,000 won) at the track |
| Budget | 10,000-20,000 won/month for info services |
| Device | Galaxy S23, rarely uses desktop |

### Simulation: First Visit (Saturday morning, 08:30 KST)

```
STEP 1: Discovery (Google search "경마 예측 AI")
→ Lands on OddsCast home page
→ SEES: DateHeader with today's race count, TodayRacesSection
→ REACTION: "Oh, today's races are already listed. Looks clean."
✅ POSITIVE: Immediate value — sees today's race info without login

STEP 2: Browse races
→ Taps a race card → /races/[id]
→ SEES: Entry table with chulNo, horse names, jockey, weight
→ SCROLLS: AI prediction preview (top 3 horses + brief comment)
→ REACTION: "Interesting, the AI picked #7... let me see the full analysis"
✅ POSITIVE: Free preview gives enough hook to want more

STEP 3: Paywall encounter
→ Taps "View Full AI Analysis"
→ SEES: "Prediction ticket required" message + login prompt
→ FRICTION: "I need to sign up just to see this?"
⚠️ RISK: May bounce here — paper guide requires no signup

STEP 4: Registration decision
→ Decides to try → /auth/register
→ FILLS: Email, password, name
→ FRICTION: Typing email on mobile is slow for 55-year-old
→ THOUGHT: "Is there Google login? That would be faster"
⚠️ NOTE: Google OAuth exists but may not be prominent enough

STEP 5: Post-registration
→ Redirected to /welcome (onboarding)
→ SEES: Welcome message, service explanation
→ Gets signup bonus: 0 RACE tickets (bonus is 1 ticket, 30-day)
→ CORRECTION: Gets 1 RACE ticket from signup bonus
→ REACTION: "OK so I can try one race for free"
✅ POSITIVE: Signup bonus lets user experience the product

STEP 6: First ticket usage
→ Goes back to race detail → uses 1 ticket
→ SEES: Full AI analysis — scores, commentary, bet type predictions
→ REACTION: "This is way more detailed than the paper guide!"
→ SPENDS: 3-4 minutes reading the analysis
✅ CONVERSION MOMENT: If analysis quality impresses, subscription likely

STEP 7: Ticket depleted
→ Browses next race → "No tickets remaining"
→ Goes to /mypage/subscriptions
→ SEES: 3 plans — LIGHT (4,900), STANDARD (9,900), PREMIUM (14,900)
→ THINKS: "STANDARD gives 20 tickets... that's about 500 won each"
→ COMPARES: Paper guide = 2,000 won/day × 4 weekends = 8,000 won/month
→ DECISION: STANDARD (9,900 won) — slightly more but way more info
✅ CONVERSION: Subscribes to STANDARD plan
```

### Weekly Usage Pattern (Post-Subscription)
```
Friday evening:
- Opens app → checks Saturday race schedule
- Views matrix (/predictions/matrix) — overview of all races
- Uses 1 MATRIX ticket (1,000 won or included in sub)
- Picks 3-4 races to focus on

Saturday morning (09:00):
- Views individual race predictions (uses 3-4 RACE tickets)
- Reads full AI analysis before heading to track
- At track: references app between races on phone

Saturday afternoon:
- Checks results as races finish
- Compares AI predictions vs actual results
- REACTION: "AI got 2 out of 4 right for top 3"

Sunday:
- Similar pattern, uses 3-4 more RACE tickets
- Monthly usage: ~16-20 RACE tickets + 4 MATRIX tickets
```

### Pain Points & Opportunities
| Issue | Severity | Recommendation |
|-------|----------|----------------|
| Mobile text too small for outdoor viewing | HIGH | Consider "at-track mode" with larger fonts |
| No offline access at racecourse (poor signal) | MEDIUM | PWA/offline cache for already-viewed predictions |
| Wants to compare AI vs actual results easily | MEDIUM | PredictionResultComparison already exists — ensure visibility |
| Confused by 15-factor scoring breakdown | LOW | Simplified "key factors" summary alongside detailed view |

---

## Persona 2: "Cautious Park" — Newcomer to Racing (48, Female)

### Profile
| Item | Detail |
|------|--------|
| Age | 48 |
| Occupation | Office worker (accounting dept) |
| Tech literacy | Medium-High — uses banking apps, online shopping |
| Racing experience | None — friend invited her to try |
| Current habit | Watches horse racing on TV occasionally |
| Budget | Hesitant to spend, needs to see value first |
| Device | iPhone 15, sometimes desktop at work |

### Simulation: Curious First Visit (Wednesday, 20:00 KST)

```
STEP 1: Friend shares link
→ Opens OddsCast in Safari
→ SEES: Home page, but no races today (weekday)
→ SEES: RecentResultsSection, AccuracyPreviewSection
→ REACTION: "There are no races right now... when do they happen?"
⚠️ FRICTION: Weekday visitor sees less value — no live content

STEP 2: Explores schedule
→ Finds /races/schedule (calendar view)
→ SEES: Upcoming race days highlighted
→ REACTION: "OK, races are Friday/Saturday/Sunday"
→ BROWSES: Past race results to understand the format
✅ POSITIVE: Calendar gives clear picture of race schedule

STEP 3: Tries to understand AI predictions
→ Clicks a completed race → sees results + prediction comparison
→ SEES: HorseScoresBarChart, prediction accuracy
→ REACTION: "So the AI predicted #3 would win and it actually did?"
→ CONFUSED: "What do 'frm', 'rat', 'jky' mean?"
⚠️ FRICTION: Racing terminology barrier for newcomers

STEP 4: Reads matrix preview
→ Goes to /predictions/matrix
→ SEES: Locked content after 2 rows preview
→ REACTION: "I don't even know how to read this yet"
→ LEAVES without registering
⚠️ RISK: Newcomer churn — needs educational content first

STEP 5: Returns Friday (friend reminds her)
→ Comes back, sees live races
→ Registers with Google login
→ Uses signup bonus ticket on friend's recommended race
→ READS: AI analysis commentary tab
→ REACTION: "The commentary explains WHY this horse is favored!"
✅ POSITIVE: Commentary tab (AI Comment) is newcomer-friendly

STEP 6: At the track Saturday (with friend)
→ Opens app to check predictions together
→ Friend explains how to read the matrix
→ Uses friend's guidance + AI commentary
→ RESULT: "This is actually fun when someone explains it"
```

### Retention Risk Assessment
```
Week 1: ⭐⭐⭐ — Excitement from first experience
Week 2: ⭐⭐ — Without friend, struggles to interpret data alone
Week 3: ⭐ — If no educational hook, likely to churn
Week 4: Churned (unless app provides learning path)
```

### Pain Points & Opportunities
| Issue | Severity | Recommendation |
|-------|----------|----------------|
| No "beginner guide" to racing terms | HIGH | Add tooltip glossary or onboarding tutorial for terms |
| Weekday visitors see empty state | HIGH | Show "this week's preview" or educational content |
| Matrix is overwhelming for newcomers | MEDIUM | "Simple view" option with just top picks + one-line reason |
| No social sharing of predictions | LOW | Allow sharing AI pick to KakaoTalk for friend discussion |

---

## Persona 3: "Data-Driven Lee" — Analytical Enthusiast (42, Male)

### Profile
| Item | Detail |
|------|--------|
| Age | 42 |
| Occupation | IT engineer (data analytics background) |
| Tech literacy | Very high — uses multiple apps, comfortable with data |
| Racing experience | 5 years, studies statistics and form guides |
| Current habit | Manually tracks horse performance in Excel |
| Budget | Will pay for quality data — price-insensitive if value proven |
| Device | MacBook Pro + iPhone, uses both |

### Simulation: Deep Evaluation (Friday, 21:00 KST)

```
STEP 1: Found via tech community recommendation
→ Opens on desktop browser
→ IMMEDIATELY goes to /predictions/accuracy
→ SEES: AI prediction hit rates, historical accuracy
→ REACTION: "Let me verify these accuracy claims"
✅ POSITIVE: Accuracy dashboard builds trust with data-oriented users

STEP 2: Examines methodology
→ Reads race detail → prediction scores
→ SEES: 15-factor breakdown (frm, rat, jky, cnd, suit, etc.)
→ REACTION: "Finally someone using multi-factor analysis, not just win rate"
→ EXPLORES: Horse detail (/horses/[hrNo]) for historical data
→ CHECKS: Jockey stats (/jockeys/[jkNo])
✅ POSITIVE: Granular data satisfies analytical users

STEP 3: Tries simulator
→ Goes to /races/[id]/simulator
→ Adjusts weights: increases jockey factor, decreases rest period
→ SEES: Re-ranked predictions with custom weights
→ REACTION: "This is exactly what I wanted — customize the model"
✅ CONVERSION TRIGGER: Simulator is the killer feature for this persona

STEP 4: Subscribes immediately
→ PREMIUM plan (14,900 won) without hesitation
→ REASON: "30 tickets + simulator + 15-factor model = worth it"
→ Also plans to use MATRIX daily for full-day analysis

STEP 5: Daily usage pattern
→ Friday night: Matrix overview + individual deep dives
→ Saturday morning: Simulator runs on 5-6 races
→ Saturday post-race: Compares predictions vs results meticulously
→ Monday: Reviews weekend accuracy, adjusts mental model
```

### Feature Requests (Predicted)
```
1. "Can I export prediction data to CSV?" — wants own analysis
2. "Show me factor correlation with actual results" — backtesting
3. "Historical accuracy by factor weight" — model validation
4. "API access for automated analysis" — power user desire
```

### Pain Points & Opportunities
| Issue | Severity | Recommendation |
|-------|----------|----------------|
| No data export capability | MEDIUM | Consider CSV download for predictions/results |
| Simulator doesn't save custom presets | MEDIUM | Allow saving/loading weight profiles |
| No backtesting feature | LOW | Future: historical simulation mode |
| Wants API access | LOW | Future: developer tier or data API |

---

## Persona 4: "Weekend Grandpa Choi" — Casual Senior (63, Male)

### Profile
| Item | Detail |
|------|--------|
| Age | 63 |
| Occupation | Retired (former civil servant) |
| Tech literacy | Low — son set up phone, uses basic apps only |
| Racing experience | 30+ years, goes to Busan racecourse |
| Current habit | Watches TV broadcasts, buys paper at track |
| Budget | Fixed income, very price-conscious |
| Device | Galaxy A54 (mid-range), large font setting enabled |

### Simulation: Son Installs App (Saturday, 07:00 KST)

```
STEP 1: Son installs and registers for him
→ Mobile app (React Native WebView)
→ Son creates account, explains basics
→ SEES: Home page with today's races
→ REACTION: "The text is clear enough, good"
✅ POSITIVE: 16px base font + accessibility settings help

STEP 2: Navigates to race
→ Taps Busan race on home
→ FRICTION: Bottom navigation icons small for large fingers
→ MANAGES: Gets to race detail
→ SEES: Entry table, scrolls horizontally
⚠️ FRICTION: Horizontal scroll on data table not intuitive for seniors

STEP 3: Reads prediction preview
→ SEES: "1st: #5 Silver Arrow, 2nd: #8 Thunder..."
→ REACTION: "I know Silver Arrow! Good horse. Let me see why"
→ TAPS: Full analysis button
→ SEES: Login required (son already logged in)
→ Uses signup bonus ticket
→ READS: Analysis in Korean
✅ POSITIVE: Korean UI language matches user expectation

STEP 4: At the track
→ Shows phone to racing friends
→ Friends: "What app is this? The AI picked the winner!"
→ VIRAL: Word-of-mouth among racing community
✅ CONVERSION: Social proof at track is strongest marketing

STEP 5: Subscription decision
→ Son helps with payment setup
→ CHOOSES: LIGHT (4,900 won) — only goes to Busan (fewer races)
→ USES: 2-3 tickets per weekend = 8-12/month out of 10
→ REACTION: "Cheaper than the paper and more useful"
```

### Accessibility Issues
```
1. Bottom nav bar touch targets: 44px minimum ✅ (already implemented)
2. Font size with system large text: needs verification
3. Color contrast for status badges: green/red distinguishable?
4. Horizontal scroll indicator: not obvious for seniors
5. Back navigation: CompactPageTitle works but "where am I?" confusion
```

### Pain Points & Opportunities
| Issue | Severity | Recommendation |
|-------|----------|----------------|
| Son needed to set up account | HIGH | Simplified "phone number only" registration? |
| Horizontal table scroll not obvious | HIGH | Visual scroll indicator or shadow hint |
| "Where am I" confusion in deep pages | MEDIUM | Breadcrumb or persistent location indicator |
| Can't easily share with track friends | MEDIUM | QR code or simple share link |
| Forgets login between visits | LOW | Biometric login via mobile app |

---

## Persona 5: "Matrix Addict Jung" — Daily Guide Buyer (50, Male)

### Profile
| Item | Detail |
|------|--------|
| Age | 50 |
| Occupation | Taxi driver |
| Tech literacy | Medium — watches YouTube, uses Naver |
| Racing experience | 10 years, watches all 3 venues every weekend |
| Current habit | Buys 3 paper guides (Seoul+Busan+Jeju) = 6,000 won/day |
| Budget | 24,000 won/month on paper guides alone |
| Device | Galaxy S22, uses while waiting for passengers |

### Simulation: Matrix Power User

```
STEP 1: Discovery via YouTube ad/review
→ Downloads app, registers
→ IMMEDIATELY goes to /predictions/matrix
→ SEES: Full-day matrix with all 3 venues
→ REACTION: "This replaces ALL three paper guides!"
✅ CONVERSION: Matrix is the primary value prop for this persona

STEP 2: Matrix deep dive
→ Uses MATRIX ticket (1,000 won or from subscription)
→ TABS: Matrix view → sees all races in grid format
→ LOVES: 7 bet type predictions in compact view
→ SWITCHES: Commentary tab for specific race insights
→ REACTION: "The commentary explains pace scenario — paper doesn't do this"
✅ STRONG FIT: Matrix + Commentary replaces paper guide entirely

STEP 3: Subscription calculation
→ Current cost: 6,000 won × 4 weekends = 24,000 won/month (paper only)
→ OddsCast PREMIUM: 14,900 won/month + MATRIX access
→ MATRIX separately: 1,000 won × 8 days = 8,000 won/month
→ DECISION: STANDARD (9,900) + buy MATRIX tickets as needed
→ TOTAL: ~17,900 won/month (saves 6,100 won vs paper)
→ PLUS: Gets individual race predictions too
✅ CLEAR VALUE: Cost saving + more data = easy decision

STEP 4: Weekly ritual
→ Friday 20:00: Opens matrix for Saturday races, plans bets
→ Saturday 07:00: Re-checks matrix (in case of weather/track changes)
→ Saturday during races: Quick reference between races
→ Saturday evening: Matrix for Sunday
→ Sunday: Same pattern
→ Total: Opens app 6-8 times per weekend
```

### Usage Data (Estimated Monthly)
```
MATRIX tickets used: 8/month (every race day)
RACE tickets used: 10-15/month (select races for deep analysis)
App sessions: 25-30/month
Average session: 5-8 minutes
Most used feature: Matrix (60%), Race Detail (30%), Results (10%)
```

### Pain Points & Opportunities
| Issue | Severity | Recommendation |
|-------|----------|----------------|
| Matrix doesn't update with live track conditions | HIGH | Real-time weather/track badge on matrix |
| Wants to mark "confident" races on matrix | MEDIUM | Star/highlight individual races on matrix |
| No comparison with yesterday's predictions | LOW | Previous day overlay or accuracy column |
| Paper guide has hand-written tips from experts | LOW | "Expert notes" section? (future) |

---

## Cross-Persona Conversion Funnel Analysis

### Awareness → First Visit
```
Persona 1 (Kim):     Google search      → Home (race day)     → HIGH engagement
Persona 2 (Park):    Friend referral    → Home (weekday)      → LOW engagement
Persona 3 (Lee):     Tech community     → Accuracy page       → HIGH engagement
Persona 4 (Choi):    Son installs       → Home (race day)     → MEDIUM engagement
Persona 5 (Jung):    YouTube/word       → Matrix immediately  → VERY HIGH engagement
```

### First Visit → Registration
```
Persona 1: Preview hook → registers to see full analysis     (70% likely)
Persona 2: Leaves on weekday, returns Friday                 (30% likely)
Persona 3: Accuracy data + simulator → immediate register    (90% likely)
Persona 4: Son handles registration                          (100% — assisted)
Persona 5: Matrix preview → registers immediately            (85% likely)
```

### Registration → First Payment
```
Persona 1: Uses signup bonus → impressed → STANDARD          (60% within 1 week)
Persona 2: Needs 2-3 weekends to decide                     (20% within 1 month)
Persona 3: Registers and subscribes same day → PREMIUM       (80% within 1 day)
Persona 4: Son helps with LIGHT plan                         (50% within 2 weeks)
Persona 5: Cost comparison → STANDARD + MATRIX               (75% within 1 week)
```

### 30-Day Retention Risk
```
Persona 1: ⭐⭐⭐⭐ LOW RISK   — Habitual weekend user, clear value
Persona 2: ⭐⭐    HIGH RISK  — Needs onboarding, may churn week 3
Persona 3: ⭐⭐⭐⭐⭐ VERY LOW  — Deep engagement, simulator keeps him
Persona 4: ⭐⭐⭐   MEDIUM     — Depends on son for troubleshooting
Persona 5: ⭐⭐⭐⭐ LOW RISK   — Matrix replaces existing habit (cost saving)
```

---

## Priority Recommendations (All Personas)

### P0 — Critical (Impacts conversion)
1. **Weekday empty state** — Show weekly preview, educational content, or "next race in X days"
2. **Racing term tooltips** — Newcomers bounce without understanding terminology
3. **Horizontal scroll indicator** — Visual cue for data tables on mobile

### P1 — Important (Impacts retention)
4. **Simplified registration** — Google OAuth prominence, phone number option
5. **Prediction vs result comparison** — Make existing feature more discoverable
6. **Matrix live conditions** — Weather/track status badge on matrix view

### P2 — Nice to have (Improves satisfaction)
7. **Simulator weight presets** — Save/load custom analysis profiles
8. **Social sharing** — KakaoTalk share for predictions
9. **Offline reading** — Cache viewed predictions for poor-signal environments
10. **Data export** — CSV for power users

---

## Metrics to Track

| Metric | Target | Persona Most Affected |
|--------|--------|----------------------|
| Signup → first ticket use | < 5 minutes | Kim, Park |
| Weekday bounce rate | < 60% | Park |
| Matrix ticket conversion | > 40% of subscribers | Jung |
| Simulator usage rate | > 15% of sessions | Lee |
| 30-day retention | > 50% | All |
| ARPU (Average Revenue Per User) | > 12,000 won/month | Kim, Jung |
| NPS (Net Promoter Score) | > 40 | All |

---

## Round 2: Post-Fix Simulation (2026-03-23)

### Changes Applied
1. Weekday empty state: racing tips + quick links (TodayRacesSection, WeekRacesSection)
2. Factor tooltips: tap-to-expand sub-scores on HorseScoresBarChart
3. Scroll indicator: fade gradient on Table wrapper when horizontally scrollable
4. Dead code removal: HorsePickPanel, picks page, rankingApi
5. Table scroll fix: overflow-x-auto on HorseEntryTable, race detail results

---

### Simulation 2-1: Park (Newcomer) — Weekday Revisit

```
STEP 1: Returns Wednesday evening (friend shared link again)
→ Opens home page
→ SEES: DateHeader says "next race is Friday (3/27)"
→ SEES: TodayRacesSection — "no races today" + quick links
→ TAPS: "AI hit rate" link → accuracy page
→ REACTION: "Oh, the AI got 68% of top-3 right? Not bad."
✅ IMPROVED: Weekday visitor now has actionable content instead of dead end

STEP 2: Explores WeekRacesSection
→ SEES: Racing tips instead of empty message
→ READS: "Check the last 5 races of each entry before race day"
→ READS: "Jockey stats vary by racecourse. Watch home venue jockeys."
→ REACTION: "I'm learning something even without races happening"
✅ IMPROVED: Educational content keeps newcomer engaged

STEP 3: Browses a past race detail
→ Taps a recent race from results section
→ SEES: AI prediction bar chart (HorseScoresBarChart)
→ TAPS: Top horse's bar → sub-score breakdown expands
→ SEES: 6 factor mini bars (rating, form, condition, exp, trainer, suitability)
→ HOVERS/TAPS: "form/momentum" label → tooltip explains it
→ REACTION: "So form means recent race trends. That makes sense!"
✅ IMPROVED: Newcomer understands scoring without external research

STEP 4: Retention prediction
→ Week 1: Returns for tips + past race browsing
→ Week 2: Attends first race with friend, uses app
→ Week 3: Tries matrix on her own, understands commentary
→ RETENTION: 45% → 55% (from 20% pre-fix)
```

### Simulation 2-2: Choi (Senior) — Tablet/Narrow Desktop

```
STEP 1: Son opens app on Samsung tablet (800px width)
→ HorseEntryTable now scrolls horizontally instead of being cut off
→ SEES: Right-edge fade gradient indicating more content
→ SWIPES: Table scrolls smoothly to reveal odds columns
→ REACTION: "Oh, I can swipe to see more"
✅ FIXED: Table no longer cut off on narrow screens

STEP 2: Views race results table
→ Results table also scrolls properly now
→ Fade gradient disappears when scrolled to end
→ REACTION: Naturally discovers all columns
✅ FIXED: Consistent scroll behavior across all tables

STEP 3: Views AI prediction rankings
→ SEES: Bar chart with horse scores
→ TAPS: First horse → sub-score breakdown appears
→ SEES: Mini bars for 6 factors with labels
→ REACTION: "This shows why the AI picked this horse"
→ But: "The factor labels are quite small (10px)"
⚠️ REMAINING: 10px factor labels may be hard for 63-year-old to read
```

### Simulation 2-3: Lee (Data Analyst) — Deep Factor Analysis

```
STEP 1: Opens race detail, expands all sub-scores
→ TAPS: Each horse bar → compares sub-score profiles
→ NOTICES: Horse #3 has high form (85) but low condition (42)
→ REACTION: "Recent form is great but condition is concerning"
→ TAPS: "condition" label → tooltip: "horse weight change, age, burden..."
→ INSIGHT: "Weight change must be significant for this horse"
✅ POSITIVE: Factor breakdown enables expert-level analysis

STEP 2: Goes to simulator
→ Already has 6-factor weight adjustment
→ NOW: Understands what each factor means from tooltips
→ Makes informed weight adjustments based on sub-score knowledge
✅ SYNERGY: Factor tooltips + simulator complement each other

STEP 3: Feature gap noted
→ "Can I see sub-scores for ALL 15 factors, not just 6?"
→ Currently: Only 6 sub-scores (rat, frm, cnd, exp, trn, suit) stored in UI
→ Missing: jky, gate, dist, rest, trng, cls, fsz, pace, sdf
⚠️ FUTURE: Power users want full 15-factor visibility
```

### Simulation 2-4: Jung (Matrix User) — Clean Navigation

```
STEP 1: Opens app, goes directly to matrix
→ Navigation: AppBar → Matrix icon → /predictions/matrix
→ SEES: Today's full race guide with 7 bet types
→ Compact view: grid with fade gradient on table edge
→ SWIPES: Table scrolls to reveal all bet type columns
✅ POSITIVE: Scroll indicator makes 7-column matrix discoverable

STEP 2: Switches to commentary tab
→ Reads per-race AI commentary
→ "The commentary is good but I can't compare it with the matrix view"
→ Has to keep switching tabs
⚠️ REMAINING: No side-by-side matrix + commentary view

STEP 3: Checks old results for accuracy
→ Goes home → taps "recent results" quick link
→ OR goes to /races → switches to results tab
→ Compares AI prediction vs actual result (PredictionResultComparison)
→ REACTION: "Good, I can verify the AI's track record"
✅ POSITIVE: Results comparison accessible from multiple paths
```

---

## Codebase Cleanup Audit (Round 2)

### Dead Code Removed
| Item | File | Lines | Reason |
|------|------|-------|--------|
| HorsePickPanel | `components/HorsePickPanel.tsx` | 224 | Never imported, picks feature disabled |
| Picks page | `pages/mypage/picks.tsx` | ~36 | Stub page for disabled feature |
| RankingApi | `lib/api/rankingApi.ts` | ~50 | No page consumes it, ranking page deleted |
| picks route | `lib/routes.ts` line 29 | 1 | Route to deleted page |

### Table Scroll Fixes
| Location | Issue | Fix |
|----------|-------|-----|
| HorseEntryTable desktop | `overflow-hidden` blocking scroll | Added `overflow-x-auto` |
| Race detail results table | Same | Added `overflow-x-auto` |
| Race detail analysis table | Same | Added `overflow-x-auto` |

### Page Consolidation Status
| Page | Status | Notes |
|------|--------|-------|
| `/results.tsx` | 301 redirect to `/races` | Already consolidated |
| `/mypage/picks.tsx` | DELETED | Dead feature removed |
| `/races/schedule.tsx` | Never existed | Calendar in DatePicker, no separate page needed |
| Profile vs MyPage vs Settings | **Keep separate** | Different purposes: account/business/preferences |

### Remaining Issues (P1 for next round)
| Issue | Persona | Severity |
|-------|---------|----------|
| Factor label font size (10px) too small for seniors | Choi | MEDIUM |
| Only 6/15 sub-scores visible in UI | Lee | LOW |
| No side-by-side matrix + commentary | Jung | LOW |
| No schedule/calendar page (mentioned in docs) | All | LOW |
| `picksApi.ts` still exists (needed for bet type label constants) | - | INFO |
