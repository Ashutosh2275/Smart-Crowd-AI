# 🚀 Smart Crowd AI

> **A real-time crowd intelligence dashboard for large venues — built with React, Firebase, and Recharts.**

Smart Crowd AI gives event operators a live command centre to monitor crowd density, manage queues, broadcast alerts, and simulate high-density scenarios — all from a premium, mobile-first interface.

---

## ✨ Features

### 🎯 Core Intelligence
- **Live Crowd Heatmap** — stadium grid with colour-coded density zones; tap any cell on mobile for full capacity telemetry
- **Occupancy Gauge** — SVG circular gauge showing overall stadium saturation with animated fill and trend arrow
- **Crowd Trend Chart** — multi-zone line chart with selectable time ranges (10 min / 30 min / 1 hr) and overlay comparison
- **Wait Time Chart** — colour-coded bar chart comparing queue wait times across all locations
- **AI Recommendations** — personalised suggestions for best visit windows, quieter alternatives, and optimal routing

### 🗺️ Navigation & Routing
- **Crowd Routing Matrix** — DFS pathfinding with a memoised result cache across live zone density data
- **Route Comparison** — three options side-by-side (Fastest / Least Crowded / Balanced)
- **Route Map** — animated visual path overlay with step-by-step directions
- **Smart Search Bar** — autocomplete with recent history, keyboard navigation (↑ ↓ Enter Esc), and clear button

### 🛡️ Admin Panel (Protected)
- **Crowd Simulator** — per-zone density sliders, Rush Mode stress test, and Random Fluctuation toggle
- **Alert Manager** — CRUD alert broadcast system with predefined templates and priority levels
- **Queue Controller** — live queue wait-time and length manipulation with surge simulation
- **System Monitor** — uptime tracking, performance telemetry, connection health, and a live log stream
- **Export Centre** — one-click export of crowd snapshot (JSON), alerts log (CSV), route history (JSON), and a PNG report via html2canvas

### ⚡ Simulation Engine
- Autonomous crowd density fluctuations (±5% every 3s)
- Event-based surge scenarios: **Entry / Halftime / Exit**
- Automated alert generation when zone density exceeds 92%
- Queue wait-time calculation from friction model
- Pause / Resume / Speed control from Dashboard

### 🔔 Notification Center
- Bell badge with unread count
- Mark-all-read and clear-all actions
- Synthetic audio alert on new notifications (toggleable)
- Per-item dismissal with exit animation

### 📱 Mobile-First
- Collapsible sidebar morphs into a fixed bottom navigation bar (`< 768px`)
- Touch-optimised heatmap (tap to reveal stats, no hover dependency)
- Responsive grids stacking to single column on small screens
- `pb-safe` padding preventing content hiding behind the bottom nav

### 🔐 Authentication
- Firebase email/password authentication (admin only)
- Demo mode with hardcoded credentials when Firebase is not configured
- `ProtectedRoute` wrapper with spinner, redirect-back, and location state
- Auth state observer with reactive context

### 🏎️ Performance
- `React.lazy` + `Suspense` code-splitting for all four page bundles
- `React.memo` on `Card`, `Skeleton`, `AlertBanner`, `StatCard`
- `useMemo` / `useCallback` throughout hot render paths
- Split `CrowdContext` into two contexts (stable meta vs. live data) to prevent simulation ticks cascading into non-data consumers
- LRU route cache keyed by density fingerprint in `routeCalculator.js`

---

## 🧱 Tech Stack

| Category | Technology |
|---|---|
| **Framework** | React 19 + Vite 8 |
| **Routing** | React Router v7 |
| **Styling** | Tailwind CSS v4 |
| **Animations** | Framer Motion v12 |
| **Charts** | Recharts v3 |
| **Icons** | Lucide React |
| **Backend / DB** | Firebase v11 (Firestore + Auth) |
| **Screenshot export** | html2canvas |
| **Date formatting** | date-fns |
| **CSS utilities** | clsx + tailwind-merge |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── admin/                 # Admin panel sub-components
│   │   ├── AlertManager.jsx
│   │   ├── CrowdSimulator.jsx
│   │   ├── ExportPanel.jsx
│   │   ├── QueueController.jsx
│   │   └── SystemMonitor.jsx
│   ├── AlertBanner.jsx
│   ├── Card.jsx
│   ├── CrowdHeatmap.jsx
│   ├── CrowdTrendChart.jsx
│   ├── ErrorBoundary.jsx
│   ├── Header.jsx
│   ├── Layout.jsx
│   ├── MobileNav.jsx
│   ├── NotificationCenter.jsx
│   ├── OccupancyGauge.jsx
│   ├── ProtectedRoute.jsx
│   ├── QueueMonitor.jsx
│   ├── Recommendations.jsx
│   ├── RouteComparison.jsx
│   ├── RouteMap.jsx
│   ├── SearchBar.jsx
│   ├── Sidebar.jsx
│   ├── Skeleton.jsx
│   ├── StatCard.jsx
│   └── WaitTimeChart.jsx
├── config/
│   └── firebase.js            # Firebase init + low-level helpers
├── context/
│   ├── AuthContext.jsx         # Auth state provider + useAuth hook
│   └── CrowdContext.jsx        # Dual-context live data + meta provider
├── hooks/
│   ├── useAdminAuth.js
│   ├── useFirestore.js
│   └── useSimulation.js       # Simulation lifecycle hook
├── pages/
│   ├── Admin.jsx
│   ├── AdminLogin.jsx
│   ├── Dashboard.jsx
│   └── Navigation.jsx
├── services/
│   ├── authService.js          # loginAdmin / logoutAdmin / observeAuthState
│   └── firebaseService.js      # saveCrowdData / getAlerts / seedInitialData
├── styles/
│   ├── animations.css          # Global keyframes + utility classes
│   └── index.css
└── utils/
    ├── alertEngine.js          # Threshold-based alert generation with throttling
    ├── cn.js                   # clsx + tailwind-merge helper
    ├── export.js               # JSON / CSV / PNG export functions
    ├── recommendations.js      # AI recommendation engine (4 analysis functions)
    ├── routeCalculator.js      # DFS pathfinder with LRU density cache
    └── simulation.js           # Autonomous crowd simulation engine
```

---

## ⚙️ Installation

### Prerequisites
- **Node.js** >= 18
- **npm** >= 9

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/smart-crowd-ai.git
cd smart-crowd-ai

# 2. Install dependencies
npm install

# 3. Set up environment variables (see section below)
cp .env.example .env.local
# Open .env.local and fill in your Firebase credentials

# 4. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in your Firebase project credentials.

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

> **Get these values from:**  
> Firebase Console → Project Settings → Your Apps → Web → SDK Configuration

> **Note:** Firebase is optional. If `VITE_FIREBASE_PROJECT_ID` is missing or contains `YOUR_`, the app runs completely in **mock/demo mode** with realistic in-memory data and a built-in demo login.

---

## 🚀 Usage Guide

### Demo Mode (no Firebase required)

1. Start the dev server: `npm run dev`
2. Navigate to [http://localhost:5173/dashboard](http://localhost:5173/dashboard)
3. Click **Admin Panel** in the sidebar — you'll be redirected to the login page
4. Click **"Fill Demo Credentials"** then **"Access Admin Panel"**

   ```
   Email:    admin@smartcrowd.ai
   Password: admin123
   ```

5. From the Admin Panel, open the **Crowd Simulation** tab and push any zone to high density
6. Switch back to the Dashboard and click **"Start Simulation"** to watch live data flow

### Key Interactions

| Feature | How to use |
|---|---|
| **Heatmap zones** | Click / tap any zone cell to reveal capacity telemetry |
| **Trend chart overlays** | Click zone badges at the top of the chart to toggle comparative lines |
| **Route planner** | Type in origin/destination search bars then click "Calculate Multi-Path Matrix" |
| **Simulation scenarios** | Dashboard → "Global Simulation Engine" → select Entry / Halftime / Exit |
| **Export data** | Admin → "Export Data" tab → choose JSON, CSV, or PNG report |
| **Notifications** | Bell icon in the header → mark read, mute, or clear all |

---

## 📸 Screenshots

> Place your screenshots in `public/screenshots/` and update the paths below.

| Dashboard | Navigation |
|---|---|
| ![Dashboard](public/screenshots/dashboard.png) | ![Navigation](public/screenshots/navigation.png) |

| Admin Panel | Mobile View |
|---|---|
| ![Admin](public/screenshots/admin.png) | ![Mobile](public/screenshots/mobile.png) |

---

## 🌩️ Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel --prod
```

Add all `VITE_FIREBASE_*` variables under **Project Settings → Environment Variables** in the Vercel dashboard.

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

Set environment variables under **Site Settings → Environment Variables** in Netlify.

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # set public dir to `dist`, SPA rewrite → index.html
npm run build
firebase deploy
```

### Docker (self-hosted)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_PROJECT_ID
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

```bash
docker build \
  --build-arg VITE_FIREBASE_API_KEY=... \
  --build-arg VITE_FIREBASE_PROJECT_ID=... \
  -t smart-crowd-ai .
docker run -p 8080:80 smart-crowd-ai
```

> **Important:** For all deployment targets, ensure your Firebase project has **Firestore** and **Authentication** enabled, and that your production domain is added to the **Authorised Domains** list in Firebase Authentication settings.

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint across all source files |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push and open a Pull Request

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">Built with React + Firebase + Tailwind CSS</p>
