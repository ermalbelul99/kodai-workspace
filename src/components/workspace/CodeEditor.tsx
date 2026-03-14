import { useCallback, useRef, useMemo } from 'react';
import Editor, { type OnChange } from '@monaco-editor/react';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from 'react-i18next';

/** Map target_programming_language values to Monaco language IDs */
const LANG_TO_MONACO: Record<string, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  csharp: 'csharp',
  cpp: 'cpp',
  go: 'go',
  rust: 'rust',
};

const FILE_EXTENSIONS: Record<string, string> = {
  javascript: '.js',
  typescript: '.ts',
  python: '.py',
  java: '.java',
  csharp: '.cs',
  cpp: '.cpp',
  go: '.go',
  rust: '.rs',
};

export const CodeEditor = () => {
  const { t } = useTranslation();
  const editorCode = useAppStore((s) => s.editorCode);
  const setEditorCode = useAppStore((s) => s.setEditorCode);
  const activeChallenge = useAppStore((s) => s.activeChallenge);
  const profile = useAppStore((s) => s.profile);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const localRef = useRef(editorCode);

  const targetLang = (profile as any)?.target_programming_language || 'javascript';
  const monacoLang = LANG_TO_MONACO[targetLang] || 'javascript';
  const fileExt = FILE_EXTENSIONS[targetLang] || '.js';

  // Re-key the editor when challenge changes to reset its internal state
  const editorKey = useMemo(
    () => `${activeChallenge?.id ?? 'none'}-${monacoLang}`,
    [activeChallenge?.id, monacoLang]
  );

  const flushToStore = useCallback(() => {
    setEditorCode(localRef.current);
  }, [setEditorCode]);

  const handleChange: OnChange = useCallback((value) => {
    localRef.current = value || '';
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(flushToStore, 500);
  }, [flushToStore]);

  const handleBlur = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    flushToStore();
  }, [flushToStore]);

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-destructive/60" />
          <div className="h-3 w-3 rounded-full bg-difficulty-medium/60" />
          <div className="h-3 w-3 rounded-full bg-accent/60" />
        </div>
        <span className="text-xs font-mono text-muted-foreground ml-2">
          {t('workspace.solutionFile').replace(/\.\w+$/, fileExt)}
        </span>
      </div>
      <Editor
        key={editorKey}
        height="100%"
        defaultLanguage={monacoLang}
        defaultValue={editorCode}
        onChange={handleChange}
        onMount={(editor) => {
          editor.onDidBlurEditorWidget(handleBlur);
        }}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 16 },
          lineNumbersMinChars: 3,
          renderLineHighlight: 'gutter',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          automaticLayout: true,
        }}
      />
    </div>
  );
};
