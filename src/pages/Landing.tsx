import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Code2, Bot, Gamepad2, ArrowRight,
  BookOpen, Globe, BarChart3,
} from 'lucide-react';
import { LanguageToggle } from '@/components/LanguageToggle';
import { HeroEditor } from '@/components/landing/HeroEditor';
import { WaitlistForm } from '@/components/landing/WaitlistForm';

const Landing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);

  const userId = useAppStore(s => s.userId);
  const hasHydrated = useAppStore(s => s._hasHydrated);
  const setLandingCode = useAppStore(s => s.setLandingCode);

  const [challengeSolved, setChallengeSolved] = useState(false);

  if (!hasHydrated) return null;
  if (userId) return <Navigate to="/dashboard" replace />;

  const scrollToHero = () => {
    heroRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleChallengeSuccess = () => setChallengeSolved(true);

  const handleSignupFromHero = () => {
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

  const courses = [
    {
      icon: BookOpen,
      titleKey: 'landing.course_python_title',
      descKey: 'landing.course_python_desc',
      lessonsKey: 'landing.course_python_lessons',
    },
    {
      icon: Globe,
      titleKey: 'landing.course_webdev_title',
      descKey: 'landing.course_webdev_desc',
      lessonsKey: 'landing.course_webdev_lessons',
    },
    {
      icon: BarChart3,
      titleKey: 'landing.course_datascience_title',
      descKey: 'landing.course_datascience_desc',
      lessonsKey: 'landing.course_datascience_lessons',
    },
  ];

  const faqs = [
    { q: 'landing.faq_1_q', a: 'landing.faq_1_a' },
    { q: 'landing.faq_2_q', a: 'landing.faq_2_a' },
    { q: 'landing.faq_3_q', a: 'landing.faq_3_a' },
    { q: 'landing.faq_4_q', a: 'landing.faq_4_a' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ─────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm font-semibold text-primary">KodAI</span>
          </div>
          <nav className="flex items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth?mode=login')}>
              {t('landing.cta_login')}
            </Button>
            <Button size="sm" onClick={() => navigate('/auth?mode=signup')}>
              {t('landing.cta_signup')}
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────── */}
      <section
        ref={heroRef}
        id="hero"
        className="mx-auto grid max-w-6xl gap-10 px-4 pt-32 pb-24 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 lg:pt-40"
      >
        <div className="space-y-5">
          <h1 className="text-5xl font-bold leading-tight tracking-tighter sm:text-6xl lg:text-8xl">
            {t('landing.hero_title')}
            <br />
            <span className="text-gradient-primary">{t('landing.hero_title_accent')}</span>
          </h1>
          <p className="max-w-md text-base text-muted-foreground leading-relaxed sm:text-lg">
            {t('landing.hero_subtitle')}
          </p>

          {challengeSolved && (
            <div className="animate-slide-up space-y-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
              <p className="text-sm font-medium text-accent">{t('landing.hero_success')}</p>
              <p className="text-sm text-muted-foreground">{t('landing.hero_signup_cta')}</p>
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

        <div className="w-full">
          <HeroEditor onSuccess={handleChallengeSuccess} />
        </div>
      </section>

      {/* ── Feature Grid ────────────────────────────── */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3 md:gap-8">
          {features.map(({ icon: Icon, titleKey, descKey }, i) => (
            <div
              key={titleKey}
              className="group relative cursor-pointer rounded-xl glass-card p-6 space-y-3 transition-all duration-300 hover:border-primary/60 hover:-translate-y-1"
              onClick={scrollToHero}
            >
              <span className="absolute -left-2 -top-6 text-[8rem] font-bold text-white/[0.03] leading-none select-none pointer-events-none">
                0{i + 1}
              </span>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{t(titleKey)}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Course Preview Carousel ─────────────────── */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">{t('landing.courses_title')}</h2>
            <p className="mt-2 text-muted-foreground">{t('landing.courses_subtitle')}</p>
          </div>

          <Carousel
            opts={{ align: 'start', loop: true }}
            className="mx-auto w-full max-w-5xl"
          >
            <CarouselContent className="-ml-4">
              {courses.map(({ icon: Icon, titleKey, descKey, lessonsKey }) => (
                <CarouselItem key={titleKey} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card
                    className="h-full cursor-pointer glass-card transition-all duration-300 hover:border-primary/60 hover:-translate-y-1"
                    onClick={scrollToHero}
                  >
                    <CardHeader className="pb-3">
                      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{t(titleKey)}</CardTitle>
                      <CardDescription className="text-xs">{t(lessonsKey)}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t(descKey)}</p>
                      <span className="mt-3 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {t('landing.course_cta')}
                      </span>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────── */}
      <section className="border-t border-border py-24 sm:py-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">
            {t('landing.faq_title')}
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map(({ q, a }, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-lg glass-card px-4"
              >
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline sm:text-base">
                  {t(q)}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {t(a)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Waitlist ────────────────────────────────── */}
      <WaitlistForm />
    </div>
  );
};

export default Landing;
