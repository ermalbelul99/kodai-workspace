import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { AuthPage } from '@/pages/Auth';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const { setUserId, setProfile } = useAppStore();
  const profileFetchedRef = useRef(false);

  useEffect(() => {
    // Single source of truth: onAuthStateChange fires for initial session too
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setAuthenticated(true);
        setLoading(false);

        // Fetch profile in background — don't block rendering
        if (!profileFetchedRef.current) {
          profileFetchedRef.current = true;
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (data) setProfile(data);
        }
      } else {
        setUserId(null);
        setProfile(null);
        setAuthenticated(false);
        profileFetchedRef.current = false;
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUserId, setProfile]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground font-mono text-sm">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return <AuthPage />;

  return <>{children}</>;
};
