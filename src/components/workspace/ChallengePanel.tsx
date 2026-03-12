import { useAppStore } from '@/store/useAppStore';
import { Zap, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const difficultyConfig = {
  easy: { label: 'Easy', className: 'bg-difficulty-easy/10 text-difficulty-easy border-difficulty-easy/30' },
  medium: { label: 'Medium', className: 'bg-difficulty-medium/10 text-difficulty-medium border-difficulty-medium/30' },
  hard: { label: 'Hard', className: 'bg-difficulty-hard/10 text-difficulty-hard border-difficulty-hard/30' },
};

export const ChallengePanel = () => {
  const { activeChallenge } = useAppStore();

  if (!activeChallenge) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-muted-foreground">
        <p className="font-mono text-sm">Select a challenge to begin...</p>
      </div>
    );
  }

  const diff = difficultyConfig[activeChallenge.difficulty as keyof typeof difficultyConfig] || difficultyConfig.easy;

  return (
    <div className="h-full overflow-y-auto p-6 scrollbar-thin space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium", diff.className)}>
            {diff.label}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-mono text-xp">
            <Zap className="h-3 w-3" />
            +{activeChallenge.xp_reward} XP
          </span>
        </div>
        <h2 className="text-xl font-bold text-foreground">{activeChallenge.title}</h2>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Description
        </h3>
        <p className="text-sm text-secondary-foreground leading-relaxed">
          {activeChallenge.description}
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Expected Output</h3>
        <div className="rounded-lg border border-border bg-muted p-3 font-mono text-sm text-terminal-green">
          {activeChallenge.expected_output}
        </div>
      </div>
    </div>
  );
};
