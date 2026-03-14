import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Code2, Bot, Gamepad2 } from 'lucide-react';

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const userId = useAppStore(s => s.userId);
  const hasHydrated = useAppStore(s => s._hasHydrated);

  // Hydration gate
  if (!hasHydrated) return null;

  // Authenticated guest guard
  if (userId) {
    return <Navigate to="/dashboard" replace />;
  }

  const features = [
    { icon: Bot, titleKey: 'landing.feature_1_title', descKey: 'landing.feature_1_desc' },
    { icon: Gamepad2, titleKey: 'landing.feature_2_title', descKey: 'landing.feature_2_desc' },
    { icon: Code2, titleKey: 'landing.feature_3_title', descKey: 'landing.feature_3_desc' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Nav */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm font-semibold text-primary">KodAI</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/auth?mode=login')}
            >
              {t('landing.cta_login')}
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/auth?mode=signup')}
            >
              {t('landing.cta_signup')}
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pt-32 pb-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pt-40">
        {/* Left — Copy */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {t('landing.hero_title')}
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground">
            {t('landing.hero_subtitle')}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" onClick={() => navigate('/auth?mode=signup')}>
              {t('landing.cta_signup')}
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/auth?mode=login')}>
              {t('landing.cta_login')}
            </Button>
          </div>
        </div>

        {/* Right — Decorative code editor */}
        <div className="relative hidden lg:block">
          <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
            {/* Title bar */}
            <div className="mb-4 flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-destructive/60" />
              <span className="h-3 w-3 rounded-full bg-accent/60" />
              <span className="h-3 w-3 rounded-full bg-primary/60" />
              <span className="ml-2 font-mono text-xs text-muted-foreground">solution.js</span>
            </div>
            {/* Fake code lines */}
            <div className="space-y-2 font-mono text-xs text-muted-foreground">
              <div><span className="text-primary">function</span> <span className="text-foreground">greet</span>(name) {'{'}</div>
              <div className="pl-4"><span className="text-primary">return</span> <span className="text-accent-foreground">`Hello, ${'${name}'}!`</span>;</div>
              <div>{'}'}</div>
              <div className="pt-2"><span className="text-primary">console</span>.<span className="text-foreground">log</span>(greet(<span className="text-accent-foreground">"KodAI"</span>));</div>
              <div className="mt-3 rounded border border-primary/20 bg-primary/5 px-3 py-1.5 text-primary">
                → Hello, KodAI!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-3">
          {features.map(({ icon: Icon, titleKey, descKey }) => (
            <div
              key={titleKey}
              className="rounded-xl border border-border bg-card p-6 space-y-3 transition-shadow hover:shadow-md"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{t(titleKey)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Landing;
