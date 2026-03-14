import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Code2, Zap } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';

const AuthPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const userId = useAppStore(s => s.userId);
  const hasHydrated = useAppStore(s => s._hasHydrated);

  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsLogin(searchParams.get('mode') !== 'signup');
  }, [searchParams]);

  useEffect(() => {
    if (hasHydrated && userId) {
      const destination = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    }
  }, [hasHydrated, userId, location.state, navigate]);

  if (!hasHydrated) return null;
  if (userId) return <Navigate to="/dashboard" replace />;

  const handleToggle = (newIsLogin: boolean) => {
    setIsLogin(newIsLogin);
    setSearchParams({ mode: newIsLogin ? 'login' : 'signup' }, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t('auth.loginSuccess'));
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success(t('auth.signupSuccess'));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 glow-primary">
            <Code2 className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm text-primary font-semibold">KodAI</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isLogin ? t('auth.welcomeBack') : t('auth.startJourney')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isLogin ? t('auth.loginSubtitle') : t('auth.signupSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl glass-card p-6">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">{t('auth.username')}</Label>
              <Input
                id="username"
                placeholder="coder_x"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/30 border-white/10 font-mono"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-black/30 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="bg-black/30 border-white/10"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full gap-2">
            <Zap className="h-4 w-4" />
            {loading ? t('auth.processing') : isLogin ? t('auth.login') : t('auth.createAccount')}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
          <button
            onClick={() => handleToggle(!isLogin)}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? t('auth.signup') : t('auth.login')}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
