import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import { getLocalizedTitle, getLocalizedDescription, getLocalizedExpectedOutput } from '@/lib/i18n-challenge';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;

type Msg = { role: 'user' | 'assistant'; content: string };

async function streamChat({
  messages,
  challengeTitle,
  challengeDescription,
  expectedOutput,
  userCode,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  challengeTitle: string;
  challengeDescription: string;
  expectedOutput: string;
  userCode: string;
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      challengeTitle,
      challengeDescription,
      expectedOutput,
      userCode,
    }),
  });

  if (resp.status === 429) {
    toast.error('Rate limit reached. Please wait a moment.');
    onDone();
    return;
  }
  if (resp.status === 402) {
    toast.error('AI credits exhausted.');
    onDone();
    return;
  }
  if (!resp.ok || !resp.body) {
    toast.error('AI tutor is unavailable right now.');
    onDone();
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = '';
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + '\n' + textBuffer;
        break;
      }
    }
  }

  // Final flush
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (raw.startsWith(':') || raw.trim() === '') continue;
      if (!raw.startsWith('data: ')) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

export const AIChatPanel = () => {
  const { t } = useTranslation();
  const chatMessages = useAppStore((s) => s.chatMessages);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const activeChallenge = useAppStore((s) => s.activeChallenge);
  const editorCode = useAppStore((s) => s.editorCode);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const assistantContentRef = useRef('');

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Msg = { role: 'user', content: input };
    addChatMessage(userMsg);
    setInput('');
    setIsTyping(true);
    assistantContentRef.current = '';

    // Build history from store (excluding the msg we just added, since addChatMessage is async)
    const history: Msg[] = [
      ...chatMessages.map((m) => ({ role: m.role, content: m.content })),
      userMsg,
    ];

    // Create initial empty assistant message
    addChatMessage({ role: 'assistant', content: '' });

    try {
      await streamChat({
        messages: history,
        challengeTitle: activeChallenge ? getLocalizedTitle(activeChallenge) : '',
        challengeDescription: activeChallenge ? getLocalizedDescription(activeChallenge) : '',
        expectedOutput: activeChallenge ? getLocalizedExpectedOutput(activeChallenge) : '',
        userCode: editorCode,
        onDelta: (chunk) => {
          assistantContentRef.current += chunk;
          // Update the last message in store
          useAppStore.setState((state) => {
            const msgs = [...state.chatMessages];
            if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
              msgs[msgs.length - 1] = {
                ...msgs[msgs.length - 1],
                content: assistantContentRef.current,
              };
            }
            return { chatMessages: msgs };
          });
        },
        onDone: () => {
          setIsTyping(false);
        },
      });
    } catch {
      setIsTyping(false);
      toast.error('Failed to get AI response.');
    }
  }, [input, isTyping, addChatMessage, chatMessages, activeChallenge, editorCode]);

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-8">
            <div className="rounded-full bg-primary/10 p-3 border border-primary/20">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t('chat.title')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('chat.subtitle')}</p>
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div key={msg.id} className={cn("flex gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="flex-shrink-0 mt-0.5">
                <div className="rounded-full bg-primary/10 p-1.5 border border-primary/20">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              </div>
            )}
            <div className={cn(
              "max-w-[85%] rounded-xl px-4 py-2.5 text-sm",
              msg.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground border border-border'
            )}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{msg.content || '...'}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 mt-0.5">
                <div className="rounded-full bg-accent/10 p-1.5 border border-accent/20">
                  <User className="h-3.5 w-3.5 text-accent" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && chatMessages[chatMessages.length - 1]?.content === '' && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="rounded-full bg-primary/10 p-1.5 border border-primary/20">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <div className="bg-muted rounded-xl px-4 py-2.5 border border-border">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.15s' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat.placeholder')}
            className="bg-muted border-border text-sm font-mono"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isTyping} className="flex-shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};
