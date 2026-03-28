import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { Terminal, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';
import { validateChallengeDetailed } from '@/lib/validateChallenge';

export const TerminalPanel = () => {
  const { t } = useTranslation();
  const terminalLines = useAppStore((s) => s.terminalLines);
  const addTerminalLine = useAppStore((s) => s.addTerminalLine);
  const clearTerminal = useAppStore((s) => s.clearTerminal);
  const editorCode = useAppStore((s) => s.editorCode);
  const activeChallenge = useAppStore((s) => s.activeChallenge);
  const triggerCelebration = useAppStore((s) => s.triggerCelebration);
  const updateXP = useAppStore((s) => s.updateXP);
  const addCompletedProgress = useAppStore((s) => s.addCompletedProgress);
  const profile = useAppStore((s) => s.profile);
  const userProgress = useAppStore((s) => s.userProgress);

  const handleRunCode = useCallback(async () => {
    clearTerminal();
    addTerminalLine({ content: '> Running code...', type: 'info' });

    if (!activeChallenge) return;

    // Check if already completed
    const alreadyCompleted = userProgress.some(
      (p) => p.challenge_id === activeChallenge.id && p.status === 'completed'
    );

    // Use execution-based validation
    const result = validateChallengeDetailed(editorCode, {
      expectedCode: activeChallenge.expected_output,
    });

    // Show captured console output in terminal
    const execResult = result as typeof result & { consoleOutput?: string[]; returnValue?: string | null };
    if (execResult.consoleOutput && execResult.consoleOutput.length > 0) {
      execResult.consoleOutput.forEach((line) => {
        addTerminalLine({ content: `> ${line}`, type: 'output' });
      });
    } else if (execResult.returnValue) {
      addTerminalLine({ content: `> ${execResult.returnValue}`, type: 'output' });
    }

    if (result.passed) {
      addTerminalLine({ content: `✓ Output matches expected: "${activeChallenge.expected_output}"`, type: 'success' });

      if (!alreadyCompleted) {
        addTerminalLine({ content: `+${activeChallenge.xp_reward} XP earned!`, type: 'success' });
        updateXP(activeChallenge.xp_reward);

        if (profile) {
          const newXP = profile.xp_points + activeChallenge.xp_reward;
          const newLevel = Math.floor(newXP / 200) + 1;
          await supabase.from('profiles').update({
            xp_points: newXP,
            current_level: newLevel,
          }).eq('id', profile.id);

          const { data } = await supabase.from('user_progress').upsert({
            user_id: profile.id,
            challenge_id: activeChallenge.id,
            status: 'completed',
            submitted_code: editorCode,
            completed_at: new Date().toISOString(),
          }, { onConflict: 'user_id,challenge_id' }).select().single();

          if (data) addCompletedProgress(data);
        }
      } else {
        addTerminalLine({ content: '✓ Already completed — no additional XP.', type: 'info' });
      }

      triggerCelebration();
    } else {
      result.errors.forEach((err) => {
        addTerminalLine({ content: `✗ ${err}`, type: 'error' });
      });
      addTerminalLine({ content: 'Try again! Check your code carefully.', type: 'info' });
    }
  }, [clearTerminal, addTerminalLine, editorCode, activeChallenge, triggerCelebration, updateXP, addCompletedProgress, profile, userProgress]);

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-terminal overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-terminal-green" />
          <span className="text-xs font-mono text-muted-foreground">{t('workspace.terminal')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearTerminal}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button size="sm" className="h-7 gap-1.5 text-xs font-mono" onClick={handleRunCode}>
            <Play className="h-3 w-3" />
            {t('common.run')}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm scrollbar-thin">
        {terminalLines.length === 0 ? (
          <p className="text-muted-foreground text-xs">{t('workspace.runCode')}</p>
        ) : (
          terminalLines.map((line) => (
            <div key={line.id} className={cn(
              "py-0.5 whitespace-pre-wrap",
              line.type === 'output' && 'text-foreground',
              line.type === 'error' && 'text-destructive',
              line.type === 'info' && 'text-muted-foreground',
              line.type === 'success' && 'text-terminal-green',
            )}>
              {line.content}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
