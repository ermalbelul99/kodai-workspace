import { useState, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle2, XCircle } from 'lucide-react';
import { validateChallenge } from '@/lib/validateChallenge';

const Editor = lazy(() => import('@monaco-editor/react'));

// The challenge: missing closing parenthesis on console.log
const INITIAL_CODE = `function greet(name) {
  return 'Hello, ' + name + '!'
}

console.log(greet('KodAI')`;

// Spec for the validator — the corrected line
const CHALLENGE_SPEC = {
  expectedCode: `function greet(name) {
  return 'Hello, ' + name + '!'
}

console.log(greet('KodAI'))`,
  // Regex fallback: must have console.log(greet( with matching parens
  pattern: /console\.log\(greet\("kodai"\)\)/,
};

interface HeroEditorProps {
  onSuccess: () => void;
}

export const HeroEditor = ({ onSuccess }: HeroEditorProps) => {
  const { t } = useTranslation();
  const [code, setCode] = useState(INITIAL_CODE);
  const [output, setOutput] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleRun = useCallback(() => {
    const passed = validateChallenge(code, CHALLENGE_SPEC);

    if (passed) {
      setOutput('Hello, KodAI!');
      setStatus('success');
      onSuccess();
    } else {
      setOutput(t('landing.hero_error'));
      setStatus('error');
    }
  }, [code, onSuccess, t]);

  return (
    <div className="rounded-xl overflow-hidden shadow-lg border-2 border-secondary border-t-primary border-l-primary">
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-destructive/60" />
          <span className="h-3 w-3 rounded-full bg-difficulty-medium/60" />
          <span className="h-3 w-3 rounded-full bg-accent/60" />
          <span className="ml-2 font-mono text-xs text-muted-foreground">challenge.js</span>
        </div>
        <Button
          size="sm"
          onClick={handleRun}
          className="gap-1.5 text-xs"
        >
          <Play className="h-3.5 w-3.5" />
          {t('landing.hero_run')}
        </Button>
      </div>

      {/* Editor */}
      <Suspense
        fallback={
          <div className="flex h-[220px] items-center justify-center bg-card">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      >
        <Editor
          height="220px"
          defaultLanguage="javascript"
          value={code}
          onChange={(v) => setCode(v || '')}
          theme="kodai-dark"
          onMount={(_editor, monaco) => {
            monaco.editor.defineTheme('kodai-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [],
              colors: {
                'editor.background': '#050505',
                'editor.lineHighlightBackground': '#111111',
                'editor.selectionBackground': '#FF3B2F33',
                'editorCursor.foreground': '#FF3B2F',
                'editorLineNumber.activeForeground': '#FF3B2F',
              },
            });
            monaco.editor.setTheme('kodai-dark');
          }}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            lineNumbersMinChars: 3,
            renderLineHighlight: 'gutter',
            overviewRulerLanes: 0,
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </Suspense>

      {/* Output panel */}
      {output && (
        <div
          className={`border-t px-4 py-3 font-mono text-sm transition-all animate-slide-up ${
            status === 'success'
              ? 'border-accent/30 bg-accent/5 text-accent'
              : 'border-destructive/30 bg-destructive/5 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            {status === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            <span className="text-xs text-muted-foreground">{t('landing.hero_output_label')}:</span>
            <span>{output}</span>
          </div>
        </div>
      )}
    </div>
  );
};
