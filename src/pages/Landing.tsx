import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Code2, Bot, Gamepad2, ArrowRight } from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { HeroEditor } from '@/components/landing/HeroEditor';

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  const userId = useAppStore(s => s.userId);
  const hasHydrated = useAppStore(s => s._hasHydrated);
  const setLandingCode = useAppStore(s => s.setLandingCode);

  const [challengeSolved, setChallengeSolved] = useState(false);

  // Hydration gate
  if (!hasHydrated) return null;

  // Authenticated guest guard
  if (userId) {
    return <Navigate to="/dashboard" replace />;
  }

  const scrollToHero = () => {
    heroRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleChallengeSuccess = () => {
    setChallengeSolved(true);
  };

  const handleSignupFromHero = () => {
    // Preserve the code they wrote
    setLandingCode(
      `function greet(name) {\n  return 'Hello, ' + name + '!'\n}\n\nconsole.log(greet('KodAI'))`
    );
    navigate('/auth?mode=signup');
  };

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
            <LanguageToggle />
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

      {/* Hero — Interactive split-screen */}
      <section
        ref={heroRef}
        id="hero"
        className="mx-auto grid max-w-6xl gap-10 px-4 pt-28 pb-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 lg:pt-36"
      >
        {/* Left — Copy */}
        <div className="space-y-5">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {t('landing.hero_title')}
            <br />
            <span className="text-gradient-cyan">{t('landing.hero_title_accent')}</span>
          </h1>
          <p className="max-w-md text-base text-muted-foreground leading-relaxed sm:text-lg">
            {t('landing.hero_subtitle')}
          </p>

          {/* Post-success signup CTA */}
          {challengeSolved && (
            <div className="animate-slide-up space-y-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
              <p className="text-sm font-medium text-accent">
                {t('landing.hero_success')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('landing.hero_signup_cta')}
              </p>
              <Button onClick={handleSignupFromHero} className="gap-2">
                {t('landing.cta_signup_hero')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {!challengeSolved && (
            <div className="flex flex-wrap gap-3 pt-1">
              <Button size="lg" onClick={() => navigate('/auth?mode=signup')}>
                {t('landing.cta_signup')}
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/auth?mode=login')}>
                {t('landing.cta_login')}
              </Button>
            </div>
          )}
        </div>

        {/* Right — Interactive Monaco Editor */}
        <div className="w-full">
          <HeroEditor onSuccess={handleChallengeSuccess} />
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-border bg-muted/30 py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3 md:gap-8">
          {features.map(({ icon: Icon, titleKey, descKey }) => (
            <div
              key={titleKey}
              className="group cursor-pointer rounded-xl border border-border bg-card p-6 space-y-3 transition-all hover:shadow-md hover:border-primary/30"
              onClick={scrollToHero}
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
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
