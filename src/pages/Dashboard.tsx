import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore, type Challenge } from '@/store/useAppStore';
import { ChallengeCard } from '@/components/ChallengeCard';
import { XPProgressBar } from '@/components/XPProgressBar';
import { Code2, LogOut, Trophy, Flame, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile, setActiveChallenge, userProgress, setUserProgress } = useAppStore();
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: challengeData } = await supabase
        .from('challenges')
        .select('*')
        .order('order_index');
      if (challengeData) setChallenges(challengeData as unknown as Challenge[]);

      if (profile) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', profile.id);
        if (progressData) setUserProgress(progressData);
      }
    };
    fetchData();
  }, [profile, setUserProgress]);

  const handleSelectChallenge = (challenge: Challenge) => {
    setActiveChallenge(challenge);
    navigate('/workspace');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success(t('common.logout'));
  };

  const completedCount = userProgress.filter((p) => p.status === 'completed').length;
  const streak = Math.min(completedCount, 7);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 glow-cyan">
              <Code2 className="h-5 w-5 text-primary" />
              <span className="font-mono text-sm font-bold text-primary">KodAI</span>
            </div>
          </div>
           <div className="flex items-center gap-3">
            <LanguageToggle />
            <span className="text-sm text-muted-foreground font-mono">
              {profile?.username || 'Coder'}
            </span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <div className="rounded-xl border border-border bg-card p-5 glow-cyan">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 border border-primary/20">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono">{t('dashboard.level')}</p>
                <p className="text-2xl font-bold text-foreground">{profile?.current_level || 1}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 glow-green">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2.5 border border-accent/20">
                <Zap className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono">{t('dashboard.totalXP')}</p>
                <p className="text-2xl font-bold text-xp">{profile?.xp_points || 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-difficulty-medium/10 p-2.5 border border-difficulty-medium/20">
                <Flame className="h-5 w-5 text-difficulty-medium" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono">{t('dashboard.streak')}</p>
                <p className="text-2xl font-bold text-foreground">{streak} 🔥</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5"
        >
          <XPProgressBar currentXP={profile?.xp_points || 0} level={profile?.current_level || 1} />
        </motion.div>

        <div>
          <div className="flex items-center gap-2 mb-5">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">{t('dashboard.challenges')}</h2>
            <span className="font-mono text-xs text-muted-foreground">
              {completedCount}/{challenges.length} {t('dashboard.completed')}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge, i) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                progress={userProgress.find((p) => p.challenge_id === challenge.id)}
                index={i}
                onClick={() => handleSelectChallenge(challenge)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
