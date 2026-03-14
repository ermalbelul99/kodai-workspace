

## Routing Restructure + Public Landing Page

### Files to change (6 total)

#### 1. `src/App.tsx` — New route topology

Remove outer `AuthGuard`. `GlobalLayout` wraps everything. Lazy-load new `Landing` page.

```text
GlobalLayout (LanguageToggle always visible)
├── /            → Landing (public, hydration-guarded)
├── /auth        → AuthPage (public, hydration-guarded)
├── /onboarding  → AuthGuard → Onboarding
├── /dashboard   → AuthGuard → OnboardingGuard → Dashboard
├── /workspace   → AuthGuard → OnboardingGuard → Workspace
└── *            → NotFound
```

No nested `<Routes>` — flat route list. `OnboardingGuard` wraps dashboard/workspace elements inline.

#### 2. `src/components/AuthGuard.tsx` — Redirect-based guard

- Remove `AuthPage` import; no longer renders it inline
- Add `useLocation()` to capture intended destination
- `loading` → render `RouteSpinner`-style spinner
- `!authenticated` → `<Navigate to="/auth" state={{ from: location }} replace />`
- `authenticated` → render children
- Profile fetching, error/retry UI — **unchanged**

#### 3. `src/pages/Auth.tsx` — Full refactor

- **Hydration guard**: Early return `null` until `_hasHydrated`; then if `userId` exists, `<Navigate to="/dashboard" replace />`
- **Query param sync**: `useSearchParams` + `useEffect` to sync `isLogin` state with `?mode=` param. Internal toggle calls `setSearchParams({ mode })` to update URL.
- **Race-condition-safe navigation**: Submit handler only calls Supabase API + shows toasts. A separate `useEffect([hasHydrated, userId])` reads `location.state?.from?.pathname` and navigates there (default `/dashboard`) when userId populates.
- Remove duplicate `LanguageToggle` (GlobalLayout provides it).

#### 4. `src/pages/Landing.tsx` — New file

- **Hydration guard**: `return null` until hydrated; redirect to `/dashboard` if `userId` exists.
- **Top nav**: KodAI logo left, two CTA buttons right (ghost "Log In" → `/auth?mode=login`, primary "Sign Up Free" → `/auth?mode=signup`).
- **Hero section**: Split layout. Left: `hero_title` (bold heading), `hero_subtitle` (muted text), CTA buttons. Right: decorative code-editor mockup (styled divs with colored dots and fake code lines).
- **Features grid**: 3-column responsive grid. Cards with `Bot`, `Gamepad2`, `Code2` icons from lucide-react.
- All text via `useTranslation()`. Navigation via `useNavigate()`. Dark theme styling (slate/indigo/cyan).

#### 5. `src/i18n/locales/en.json` — Add `landing` object

```json
"landing": {
  "hero_title": "The Future of Programming Starts Here.",
  "hero_subtitle": "Learn to code through interactive games and an AI Assistant that speaks your language. Built especially for kids and teens in Albania.",
  "cta_login": "Log In",
  "cta_signup": "Sign Up Free",
  "feature_1_title": "Your Personal AI Tutor",
  "feature_1_desc": "Stuck on code? Our AI assistant explains errors step by step in your language, without giving away the solution.",
  "feature_2_title": "Learn Through Play",
  "feature_2_desc": "Earn XP, level up, and conquer challenges designed to make coding feel like a game.",
  "feature_3_title": "Real Code, Real Skills",
  "feature_3_desc": "Write actual code in a real editor. No drag-and-drop — learn the skills that matter."
}
```

#### 6. `src/i18n/locales/sq.json` — Add `landing` object

```json
"landing": {
  "hero_title": "E Ardhmja e Programimit Fillon Këtu.",
  "hero_subtitle": "Mëso të kodosh përmes lojërave interaktive dhe një Asistenti Inteligjent (AI) që flet gjuhën tënde. E krijuar posaçërisht për fëmijët dhe të rinjtë në Shqipëri.",
  "cta_login": "Hyr",
  "cta_signup": "Regjistrohu Falas",
  "feature_1_title": "Mësuesi yt Personal AI",
  "feature_1_desc": "Ngece në kod? Asistenti ynë AI të shpjegon gabimet hap pas hapi në shqip, pa të dhënë zgjidhjen e gatshme.",
  "feature_2_title": "Mëso Duke Luajtur",
  "feature_2_desc": "Fito XP, ngri nivelin dhe përmbys sfidat e dizajnuara që kodimi të duket si lojë.",
  "feature_3_title": "Kod i Vërtetë, Aftësi të Vërteta",
  "feature_3_desc": "Shkruaj kod të vërtetë në një editor real. Pa drag-and-drop — mëso aftësitë që kanë rëndësi."
}
```

### Lifecycle safeguards summary

| Safeguard | Landing.tsx | Auth.tsx | AuthGuard.tsx |
|-----------|------------|---------|---------------|
| Hydration gate (`!hasHydrated → null`) | Yes | Yes | N/A (owns auth state) |
| Authenticated bounce (`userId → /dashboard`) | Yes | Yes | N/A |
| Intent-preserving redirect | N/A | Reads `location.state.from` | Passes `{ from: location }` |
| Race-condition-safe nav | N/A | `useEffect([userId])` navigates, not submit handler | N/A |
| Search param sync | N/A | `useEffect([searchParams])` syncs `isLogin` + `handleToggle` updates URL | N/A |

### What stays untouched
- `OnboardingGuard`, `useAppStore`, `Onboarding.tsx`, `Dashboard.tsx`, `Workspace.tsx`, all workspace components

