import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockResponses = [
  "Great question! Let me help you think through this. Consider what the function should return and work backwards from the expected output.",
  "Here's a hint: break the problem into smaller steps. What's the first thing your function needs to do?",
  "Try using a built-in JavaScript method here. Check out `Array.prototype.map()` or `String.prototype.split()` — they might be useful!",
  "Remember, the key to solving this is understanding the input and output types. What type does your function receive, and what should it return?",
  "You're on the right track! Think about edge cases — what happens with empty inputs or boundary values?",
];

export const AIChatPanel = () => {
  const { t } = useTranslation();
  const chatMessages = useAppStore((s) => s.chatMessages);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;

    addChatMessage({ role: 'user', content: input });
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      addChatMessage({ role: 'assistant', content: response });
      setIsTyping(false);
    }, 1000 + Math.random() * 1500);
  }, [input, addChatMessage]);

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
              {msg.content}
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

        {isTyping && (
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
