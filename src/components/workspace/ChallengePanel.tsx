import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { Zap, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLocalizedTitle, getLocalizedDescription, getLocalizedExpectedOutput } from '@/lib/i18n-challenge';

export const ChallengePanel = () => {
  const { t } = useTranslation();
  const activeChallenge = useAppStore((s) => s.activeChallenge);

  if (!activeChallenge) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-muted-foreground">
        <p className="font-mono text-sm">{t('workspace.selectChallenge')}</p>
      </div>
    );
  }

  const difficultyKey = activeChallenge.difficulty as 'easy' | 'medium' | 'hard';
  const difficultyConfig = {
    easy: { className: 'bg-difficulty-easy/10 text-difficulty-easy border-difficulty-easy/30' },
    medium: { className: 'bg-difficulty-medium/10 text-difficulty-medium border-difficulty-medium/30' },
    hard: { className: 'bg-difficulty-hard/10 text-difficulty-hard border-difficulty-hard/30' },
  };
  const diff = difficultyConfig[difficultyKey] || difficultyConfig.easy;

  return (
    <div className="h-full overflow-y-auto p-6 scrollbar-thin space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium", diff.className)}>
            {t(`difficulty.${difficultyKey}`)}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-mono text-xp">
            <Zap className="h-3 w-3" />
            +{activeChallenge.xp_reward} XP
          </span>
        </div>
        <h2 className="text-xl font-bold text-foreground">{getLocalizedTitle(activeChallenge)}</h2>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          {t('workspace.description')}
        </h3>
        <p className="text-sm text-secondary-foreground leading-relaxed">
          {getLocalizedDescription(activeChallenge)}
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">{t('workspace.expectedOutput')}</h3>
        <div className="rounded-lg border border-border bg-muted p-3 font-mono text-sm text-terminal-green">
          {getLocalizedExpectedOutput(activeChallenge)}
        </div>
      </div>
    </div>
  );
};
