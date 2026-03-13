import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Zap, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Challenge, UserProgress } from '@/store/useAppStore';
import { getLocalizedTitle, getLocalizedDescription } from '@/lib/i18n-challenge';

interface ChallengeCardProps {
  challenge: Challenge;
  progress?: UserProgress;
  index: number;
  onClick: () => void;
}

export const ChallengeCard = ({ challenge, progress, index, onClick }: ChallengeCardProps) => {
  const { t } = useTranslation();
  const isCompleted = progress?.status === 'completed';
  const difficultyKey = challenge.difficulty as 'easy' | 'medium' | 'hard';

  const difficultyConfig = {
    easy: { className: 'text-difficulty-easy border-difficulty-easy/30 bg-difficulty-easy/10' },
    medium: { className: 'text-difficulty-medium border-difficulty-medium/30 bg-difficulty-medium/10' },
    hard: { className: 'text-difficulty-hard border-difficulty-hard/30 bg-difficulty-hard/10' },
  };

  const diff = difficultyConfig[difficultyKey] || difficultyConfig.easy;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={onClick}
      className={cn(
        "group relative w-full rounded-xl border bg-card p-5 text-left transition-all duration-200",
        "hover:border-primary/40 hover:glow-cyan",
        isCompleted ? "border-accent/30" : "border-border"
      )}
    >
      {isCompleted && (
        <div className="absolute -right-2 -top-2 rounded-full bg-accent p-1">
          <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg border",
            isCompleted ? "border-accent/30 bg-accent/10" : "border-border bg-muted"
          )}>
            <Code2 className={cn("h-5 w-5", isCompleted ? "text-accent" : "text-muted-foreground")} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {getLocalizedTitle(challenge)}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{getLocalizedDescription(challenge)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium", diff.className)}>
          {t(`difficulty.${difficultyKey}`)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-mono text-xp">
          <Zap className="h-3 w-3" />
          +{challenge.xp_reward} XP
        </span>
      </div>
    </motion.button>
  );
};
