# MCR Guard — Cricket Broadcast Master-Control Ad Defense Simulator

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-2.1-green.svg)](https://vitest.dev/)
[![Tests](https://img.shields.io/badge/Tests-43%20Passed-brightgreen.svg)]()

**MCR Guard** is a local, high-fidelity web application simulating a television broadcast Master Control Room (MCR) during an International One-Day International (ODI) cricket match.

In this simulator, **you play the broadcaster's Master Control Operator**. You hold final say over every commercial advertisement pod transmitted on air. A defensive rule engine monitors every placement, protects advertisers' brand reputation from competitor proximity and sensitive match contexts, and computes non-clashing permutations.

---

## 🌟 Key Architecture & Capabilities

### 1. Match Simulator & Operator Hold-Point Matrix
- **ODI Ball-by-Ball Simulator**: Full 2-innings, 50-overs-per-side match with realistic ball physics and probability distributions (*dots, singles, doubles, boundaries, sixes, dismissals, wides, no-balls*).
- **Operator-Driven Breaks**: The simulation never airs ads autonomously. It reports events and holds play for your command:
  - **State A (Over Complete, no wicket on last ball)**: Enables **Over Break (60s)** and **Strategic Timeout (300s)**.
  - **State B (Wicket fell mid-over)**: Enables **Wicket Break (90s)** only.
  - **State C (Wicket on the last ball of an over)**: Enables **Wicket Break**, **Over Break**, and **Strategic Timeout** concurrently. Operator selects one break; over boundary is handled with no duplicate hold.
  - **"Continue without ads"**: Skip button on the hold banner allows resuming match play immediately without airing commercial inventory (logged in audit trail).
- **Wicket Idempotency**: Dismissals are recorded exactly once at the moment of fall. Selecting Over or Strategic after a last-ball wicket never adds duplicate wickets.
- **Lineups & Teams**: India vs. Australia featuring full player rosters, live strike rotation, and commentary tickers.

### 2. Spot-Duration Mix (35% × 15s • 50% × 30s • 15% × 45s)
- **Ordered Composition Generator**: Decomposes exact pod durations (60s, 90s, 300s) into ordered compositions of $\{15\text{s}, 30\text{s}, 45\text{s}\}$.
- **Mathematical Hard Constraints**:
  1. $\ge 2$ distinct spot lengths per pod (eliminates monotone pods like $30\text{s} + 30\text{s}$).
  2. Run-length $\le 2$ (no more than 2 identical spot lengths consecutively).
  3. Pattern derangement from the previous aired pod.
- **Quadratic Mix Balancer**: Nudges pattern selection dynamically toward running broadcast targets ($35\%\ 15\text{s}$, $50\%\ 30\text{s}$, $15\%\ 45\text{s}$).

### 3. Defensive Rule Engine & Mathematical Combinatorics
- **Defensive Safeguards**:
  - `Same-Category Adjacency` (BLOCK: rivals in the same sector cannot sit side by side).
  - `Explicit Rival Neighbour List` (BLOCK: direct competitors barred from adjacency).
  - `Contract Compliance` (BLOCK: innings and break type entitlements).
  - `Cross-Pod Positional Clash / Rook Board` (WARN).
  - `Derangement Rule` (WARN: brands must rotate slot positions across pods).
  - `Brand-Safety Contextual Alignment` (WARN: e.g. avoid high-energy celebratory ads immediately after an Indian superstar dismissal).
- **Maths Panel**:
  - **Principle of Inclusion-Exclusion (PIE)**: Calculates exact permutations avoiding disjoint rival pair adjacencies:
    $$N = \sum_{k=0}^{m} (-1)^k \binom{m}{k} 2^k (n-k)!$$
  - **Rook Polynomial on Forbidden Board**: Computes non-attacking rook placements for cross-pod slot continuity:
    $$N(B) = \sum_{k=0}^{n} (-1)^k r_k (n-k)!$$
  - **Derangements ($!n$)**: Computes zero fixed-point slot permutations ($!n \approx [n! / e]$).
  - **Live Completion Counter**: Real-time counter of remaining valid brand completions.

### 4. Manual Infinity (Unscheduled Stoppage Mode)
- Handles unexpected real-world delays of unknown duration (*Rain, Floodlight failure, Player injury, Crowd disturbance, Technical fault*).
- Freezes the match clock at the exact legal ball and bowler state.
- Broadcasts sequential 90s pods (configurable to 60s or 120s) with zero dead air.
- Automatically falls back to broadcaster public service announcements (PSAs) and house promos if commercial inventory is exhausted.
- Clean exit with a 3-second **"Back to Live"** countdown broadcast slate.

### 5. Audit Trail & End-of-Match Governance Report
- Tracks every pod aired, brand exposure counts, and prime slot positions (slots 1 and $N$).
- Comprehensive record of operator overrides with mandatory written justifications.
- **Advertiser Reputation Risk Index (0–100)**: Quantifies brand exposure safety.
- 1-click **JSON export** and **print-ready report**.

---

## 📁 Project File Structure

```
math exp le/
├── .gitignore                   # Excludes node_modules, build artifacts, logs
├── index.html                   # HTML entry point with Inter font & viewport
├── package.json                 # Dependencies and scripts (React 18, Vite, Vitest, Lucide)
├── package-lock.json            # Deterministic dependency lockfile
├── postcss.config.js            # PostCSS configuration for Tailwind
├── tailwind.config.js           # Tailwind CSS configuration with Light Studio theme
├── tsconfig.json                # TypeScript strict configuration
├── vite.config.ts               # Vite bundler configuration
├── sample_match_timeline.csv    # Real match replay timeline (120 pods)
├── src/
│   ├── main.tsx                 # React application root DOM mount
│   ├── App.tsx                  # Main layout, simulator coordinator, popup queue
│   ├── index.css                # Tailwind utility directives and custom animations
│   ├── data/
│   │   └── syntheticBrands.ts   # 50 brands across 15 sectors with multi-duration spots
│   ├── engine/
│   │   ├── types.ts             # Core domain models (AdPod, BrandAd, RuleViolation, etc.)
│   │   ├── prng.ts              # Deterministic Mulberry32 pseudorandom generator
│   │   ├── matchSimulator.ts    # Ball-by-ball ODI simulation engine & hold matrix
│   │   ├── patternEngine.ts     # Ordered composition generator & 35/50/15 mix ranker
│   │   ├── autopilot/
│   │   │   ├── types.ts         # Types for one-shot breaks & stoppage states
│   │   │   ├── autoFillEngine.ts# Zero-BLOCK pod auto-filler with multi-pattern fallback
│   │   │   └── stoppageEngine.ts# Manual Infinity engine with 3s live slate & buffers
│   │   ├── math/
│   │   │   ├── combinatorics.ts # PIE, Rook polynomials, and subfactorials (!n)
│   │   │   └── completionCounter.ts # Live permutation space calculator
│   │   ├── rules/
│   │   │   └── ruleEngine.ts    # 8 defensive brand safety and adjacency rules
│   │   └── suggestions/
│   │       └── suggestionEngine.ts # Candidate scoring and normalized tier ranker
│   └── components/
│       ├── Header.tsx           # Top navigation, one-shot break buttons & tooltip matrix
│       ├── MatchRibbon.tsx      # Live cricket scoreboard, run rates & batter status
│       ├── HoldBanner.tsx       # Operator hold alert with "Continue without ads"
│       ├── MathsPanel.tsx       # Defensive combinatorics & 35/50/15 mix histogram
│       ├── EndOfMatchReport.tsx # Audit report modal with export and print capabilities
│       ├── MatchReplayModal.tsx # CSV/JSON replay loader & deterministic re-seeding
│       ├── AdConsole/
│       │   └── AutonomousOnAirPod.tsx # Live on-air pod countdown & slot card views
│       ├── Autopilot/
│       │   ├── BackToLiveSlate.tsx    # 3-second full-screen broadcast slate
│       │   ├── StoppageBanner.tsx     # Stoppage alert with elapsed timer & switcher
│       │   └── StoppageReasonModal.tsx# Unscheduled delay reason selector
│       └── Popups/
│           └── BreakResumePopupQueue.tsx # Non-overlapping FIFO modal queue
└── tests/
    ├── combinatorics.test.ts             # Mathematical proofs (PIE, Rook, !n)
    ├── rules.test.ts                     # Defensive rule violation checks
    ├── manualInfinity.test.ts            # Unscheduled stoppage & clock freeze tests
    ├── oneShotBreaks.test.ts             # One-shot break lifecycle tests
    ├── operatorBreaksAndDurationMix.test.ts # 1,000-pod 35/50/15 duration mix benchmark
    └── holdPointMatrix.test.ts           # State A, B, C hold points & wicket accounting
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher recommended)
- `npm`, `pnpm`, or `yarn`

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd "math exp le"

npm install
```

### 2. Development Server
Start the local Vite dev server:
```bash
npm run dev
```
Open your browser at **`http://localhost:5173`** (or the port shown in your terminal).

### 3. Run Test Suite
Execute all Vitest test suites (43 tests):
```bash
npm test
```

### 4. Build for Production
Type-check and create an optimized production build:
```bash
npm run build
```
Build artifacts are placed in the `dist/` directory.

---

## 📤 How to Upload to GitHub

This directory is initialized as a clean Git repository with `.gitignore` configured to exclude `node_modules` and build directories.

To publish this project to your GitHub account:

1. **Create a new empty repository** on GitHub (do **not** check "Initialize with README", "Add .gitignore", or "Add license", as they are already included).
2. Run the following commands in this directory:
```bash
# 1. Stage all project files
git add .

# 2. Create the initial commit
git commit -m "feat: complete MCR Guard cricket broadcast simulator"

# 3. Rename branch to main (if not already main)
git branch -M main

# 4. Link your remote GitHub repository
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPOSITORY_NAME>.git

# 5. Push to GitHub
git push -u origin main
```

---

## 📜 License
MIT License. Created for the Broadcaster Master Control Room Simulation.
