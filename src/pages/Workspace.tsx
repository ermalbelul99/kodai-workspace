import { lazy, Suspense } from 'react';
import SuccessCelebration from '@/components/workspace/SuccessCelebration';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, Bot, Code2 } from 'lucide-react';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getLocalizedTitle } from '@/lib/i18n-challenge';

const CodeEditor = lazy(() => import('@/components/workspace/CodeEditor').then((m) => ({ default: m.CodeEditor })));
const TerminalPanel = lazy(() => import('@/components/workspace/TerminalPanel').then((m) => ({ default: m.TerminalPanel })));
const ChallengePanel = lazy(() => import('@/components/workspace/ChallengePanel').then((m) => ({ default: m.ChallengePanel })));
const AIChatPanel = lazy(() => import('@/components/workspace/AIChatPanel').then((m) => ({ default: m.AIChatPanel })));

const EditorSkeleton = () => (
  <div className="h-full w-full rounded-lg border border-border bg-card overflow-hidden">
    <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
      <div className="flex gap-1.5">
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-3 rounded-full" />
        <Skeleton className="h-3 w-3 rounded-full" />
      </div>
      <Skeleton className="h-3 w-20 ml-2" />
    </div>
    <div className="p-4 space-y-2">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: `${40 + Math.random() * 50}%` }} />
      ))}
    </div>
  </div>
);

const TerminalSkeleton = () => (
  <div className="flex h-full flex-col rounded-lg border border-border bg-card overflow-hidden">
    <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-7 w-16" />
    </div>
    <div className="p-4">
      <Skeleton className="h-3 w-48" />
    </div>
  </div>
);

const PanelSkeleton = () => (
  <div className="p-6 space-y-4">
    <Skeleton className="h-6 w-16 rounded-full" />
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-4 w-2/3" />
  </div>
);

const Workspace = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const activeChallenge = useAppStore((s) => s.activeChallenge);
  const hasHydrated = useAppStore((s) => s._hasHydrated);

  useEffect(() => {
    if (hasHydrated && !activeChallenge) navigate('/');
  }, [activeChallenge, navigate, hasHydrated]);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!activeChallenge) return null;

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm font-semibold text-primary">KodAI</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <span className="text-sm font-medium text-foreground">{getLocalizedTitle(activeChallenge)}</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[380px] flex-shrink-0 border-r border-border flex flex-col">
          <Tabs defaultValue="challenge" className="flex flex-1 flex-col overflow-hidden">
            <TabsList className="mx-3 mt-3 bg-muted border border-border">
              <TabsTrigger value="challenge" className="gap-1.5 text-xs font-mono data-[state=active]:bg-card data-[state=active]:text-primary">
                <BookOpen className="h-3.5 w-3.5" />
                {t('workspace.challenge')}
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-1.5 text-xs font-mono data-[state=active]:bg-card data-[state=active]:text-primary">
                <Bot className="h-3.5 w-3.5" />
                {t('workspace.aiTutor')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="challenge" className="flex-1 overflow-hidden mt-0">
              <Suspense fallback={<PanelSkeleton />}>
                <ChallengePanel />
              </Suspense>
            </TabsContent>
            <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
              <Suspense fallback={<PanelSkeleton />}>
                <AIChatPanel />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-[7] overflow-hidden p-2 pb-1">
            <Suspense fallback={<EditorSkeleton />}>
              <CodeEditor />
            </Suspense>
          </div>
          <div className="flex-[3] overflow-hidden p-2 pt-1">
            <Suspense fallback={<TerminalSkeleton />}>
              <TerminalPanel />
            </Suspense>
          </div>
        </div>
      </div>
      <SuccessCelebration />
    </div>
  );
};

export default Workspace;
