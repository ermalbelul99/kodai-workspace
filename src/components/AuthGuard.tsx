import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { AuthPage } from '@/pages/Auth';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const { setUserId, setProfile } = useAppStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setAuthenticated(true);
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (data) setProfile(data);
      } else {
        setUserId(null);
        setProfile(null);
        setAuthenticated(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setAuthenticated(true);
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => { if (data) setProfile(data); });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUserId, setProfile]);

  if (loading || !authenticated) return <AuthPage />;

  return <>{children}</>;
};
