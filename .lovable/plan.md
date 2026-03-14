

## Reactive Profile Fetching — AuthGuard Refactor

### Problem
The `onAuthStateChange` callback is `async` and awaits a profile query, which blocks `signInWithPassword` from resolving (Supabase waits for all listeners to complete). This causes the login to hang on "processing."

### Design

Separate concerns into two reactive layers:

1. **Auth listener** — synchronous, only sets `userId` and `authenticated`
2. **Profile fetcher** — a separate `useEffect` that reacts to `userId` changes

```text
onAuthStateChange / getSession
  → sets userId + authenticated (sync, no DB calls)

useEffect([userId])
  → if userId exists: fetch profile → setProfile → setLoading(false)
  → if userId is null: setLoading(false)
```

### Implementation: `src/components/AuthGuard.tsx`

```typescript
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { AuthPage } from '@/pages/Auth';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const { userId, setUserId, setProfile } = useAppStore();
  const authResolved = useRef(false);

  // Layer 1: Auth state — purely synchronous, no DB calls
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
          setAuthenticated(true);
        } else {
          setUserId(null);
          setProfile(null);
          setAuthenticated(false);
          setLoading(false); // no user → done immediately
        }
        authResolved.current = true;
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!authResolved.current) {
        if (session?.user) {
          setUserId(session.user.id);
          setAuthenticated(true);
        } else {
          setLoading(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setUserId, setProfile]);

  // Layer 2: Profile fetcher — reacts to userId
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setProfileError(false);

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setProfileError(true);
        setLoading(false);
        return;
      }

      if (data) setProfile(data);
      setLoading(false);
    };

    fetchProfile();
    return () => { cancelled = true; };
  }, [userId, setProfile]);

  // Error state with retry
  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            Failed to load your profile.
          </p>
          <button
            onClick={() => { setProfileError(false); setLoading(true); }}
            // triggers re-fetch via userId dep staying the same — 
            // we'll use a retry counter instead
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading || !authenticated) return <AuthPage />;

  return <>{children}</>;
};
```

**Retry mechanism refinement:** Add a `retryCount` state that increments on retry button click and is included in the profile `useEffect` dependency array, so clicking "Retry" re-triggers the fetch without needing to change `userId`.

### Key details

| Aspect | How it's handled |
|--------|-----------------|
| No blocking in auth callback | Callback is synchronous — no `async`, no `await` |
| Optimistic welcome page | `loading \|\| !authenticated` still renders `<AuthPage />` instantly |
| Profile fetch errors | Dedicated error state with Retry button |
| `.single()` risk | Replaced with `.maybeSingle()` per project conventions |
| Unnecessary re-renders | `useRef` for `authResolved` flag avoids duplicate state sets; profile effect only runs when `userId` changes |
| Unused import cleanup | Remove `useTranslation` (not used in guard) |

### Files changed
- `src/components/AuthGuard.tsx` — full rewrite as above

### What stays the same
- Font preconnect in `index.html`
- Route-level lazy loading in `App.tsx`
- `OnboardingGuard`, `useAppStore`, Auth page — untouched

