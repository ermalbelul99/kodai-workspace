

## Three Hardening Tasks for the Landing Page Overhaul

These are pre-implementation safeguards that must be in place before the interactive hero is built.

---

### Task 1: Secure Waitlist Table Migration

Create `waitlist_leads` with a Postgres-level email validation constraint and a write-only RLS policy.

**SQL migration:**
```sql
CREATE TABLE public.waitlist_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_leads_email_format
    CHECK (email ~* '^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$'),
  CONSTRAINT waitlist_leads_email_length CHECK (char_length(email) <= 254),
  UNIQUE (email)
);

ALTER TABLE public.waitlist_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

No SELECT/UPDATE/DELETE policies — data is write-only from the client. A comment will be added noting the eventual migration to an Edge Function with rate limiting.

**Acknowledged limitation:** Direct anon INSERT is a temporary measure. A future Edge Function will wrap this insert behind IP-based rate limiting and CAPTCHA verification.

---

### Task 2: Robust Code Validation via Normalized Regex

For the interactive hero challenge (to be built in Milestone 2), we need a validation utility that doesn't break on whitespace, quote style, or semicolons.

**New file: `src/lib/validateChallenge.ts`**

Strategy: Normalize the user's code before matching — strip all whitespace, normalize quotes to a single canonical form, strip trailing semicolons — then compare against a normalized expected pattern using regex.

```typescript
function normalizeCode(code: string): string {
  return code
    .replace(/\/\/.*$/gm, '')       // strip single-line comments
    .replace(/\s+/g, '')            // collapse all whitespace
    .replace(/["'`]/g, '"')         // normalize quotes to double
    .replace(/;/g, '')              // strip semicolons
    .toLowerCase();
}

function validateChallenge(userCode: string, expectedPattern: RegExp, expectedNormalized: string): boolean {
  const normalized = normalizeCode(userCode);
  // Primary: normalized string match
  if (normalized === normalizeCode(expectedNormalized)) return true;
  // Fallback: regex on normalized code
  return expectedPattern.test(normalized);
}
```

This handles: `console.log('Hello')` vs `console.log("Hello");` vs `console.log(  "Hello" )  ;` — all pass.

---

### Task 3: Audit State Preservation Through Auth Flow

**Finding:** The Zustand store persists `editorCode` to sessionStorage via `partialize`. The risk is in `setActiveChallenge` (line 67-72 of `useAppStore.ts`), which resets `editorCode` to `challenge?.initial_code || ''`. 

The auth flow itself (`Auth.tsx`) does NOT call `setActiveChallenge` or `setEditorCode` — it only triggers Supabase auth and waits for the store's `userId` to populate. The `AuthGuard` only sets `userId` and `profile`. So **editorCode survives the auth transition intact** — no bug here.

However, the danger point is when the user later enters the workspace and selects their first challenge — `setActiveChallenge` will overwrite `editorCode`. To preserve the landing page code:

**Change in `src/store/useAppStore.ts`:** Add a `landingCode` field that is set when navigating from the landing hero to signup, separate from `editorCode`. This ensures the interactive hero code is preserved independently of workspace state.

```typescript
// Add to AppState interface:
landingCode: string;
setLandingCode: (code: string) => void;

// Add to partialize:
landingCode: state.landingCode,
```

The HeroEditor component (Milestone 2) will call `setLandingCode(code)` before navigating to `/auth?mode=signup`. The workspace can later reference `landingCode` if needed without conflicting with `editorCode`.

---

### Files changed

| File | Action |
|------|--------|
| DB migration | Create `waitlist_leads` table with CHECK + RLS |
| `src/lib/validateChallenge.ts` | New utility for normalized code validation |
| `src/store/useAppStore.ts` | Add `landingCode` field + persist it |
| `src/i18n/locales/en.json` | Add waitlist i18n keys |
| `src/i18n/locales/sq.json` | Add waitlist i18n keys |

### What stays untouched
- `src/App.tsx`, `src/pages/Auth.tsx`, `src/components/AuthGuard.tsx` — no changes needed
- All existing routing guards and lifecycle safeguards — preserved

