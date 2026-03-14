import { useEffect, useState, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { userId, setUserId, setProfile } = useAppStore();
  const authResolved = useRef(false);
  const location = useLocation();

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
          setLoading(false);
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

  // Layer 2: Profile fetcher — reacts to userId changes
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
  }, [userId, retryCount, setProfile]);

  // Error state with retry
  if (profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            Failed to load your profile.
          </p>
          <button
            onClick={() => { setProfileError(false); setLoading(true); setRetryCount(c => c + 1); }}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="font-mono text-xs text-muted-foreground">Loading…</span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
