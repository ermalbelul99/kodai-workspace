import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface XPProgressBarProps {
  currentXP: number;
  level: number;
}

const xpForLevel = (level: number) => level * 200;

export const XPProgressBar = ({ currentXP, level }: XPProgressBarProps) => {
  const { t } = useTranslation();
  const xpNeeded = xpForLevel(level);
  const xpInLevel = currentXP % xpNeeded || (currentXP > 0 ? xpNeeded : 0);
  const progress = Math.min((xpInLevel / xpNeeded) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-mono text-muted-foreground">
          {t('xp.level')} <span className="text-primary font-bold">{level}</span>
        </span>
        <span className="font-mono text-xp text-xs">
          {currentXP} / {xpNeeded} {t('xp.xpOf')}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted border border-border">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, hsl(187 80% 48%), hsl(150 70% 45%))',
          }}
        />
      </div>
    </div>
  );
};
