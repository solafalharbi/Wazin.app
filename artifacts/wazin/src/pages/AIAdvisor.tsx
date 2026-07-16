import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGetChatHistory, useSendChatMessage } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Bot, Send, User, Sparkles, TrendingUp, ShieldAlert, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AIAdvisor() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { data: history, isLoading, refetch } = useGetChatHistory();
  const sendMessage = useSendChatMessage();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, sendMessage.isPending]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    const messageToSend = input;
    setInput('');

    sendMessage.mutate({
      data: {
        message: messageToSend,
        language: language as any
      }
    }, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  const suggestions = [
    { icon: TrendingUp, ar: 'كيف يمكنني استثمار 500 ريال؟', en: 'How can I invest 500 SR?' },
    { icon: ShieldAlert, ar: 'كيف أستعد لانهيار السوق؟', en: 'How to prepare for a market crash?' },
    { icon: Target, ar: 'أريد خطة لادخار 10,000 ريال', en: 'I want a plan to save 10,000 SR' },
  ];

  const messages = history || [
    {
      id: 1,
      role: 'assistant',
      contentAr: `أهلاً بك يا ${user?.username ?? ''}! أنا مستشارك المالي الذكي. كيف يمكنني مساعدتك في تحقيق أهدافك المالية اليوم؟`,
      contentEn: `Welcome ${user?.username ?? ''}! I am your AI financial advisor. How can I help you achieve your financial goals today?`,
      createdAt: new Date().toISOString()
    }
  ];

  return (
    <div className="h-[calc(100dvh-8rem)] md:h-[calc(100dvh-6rem)] flex flex-col max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4 shadow-sm">
          <Bot size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{t('المستشار الذكي', 'AI Advisor')}</h1>
        <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
          {t('اسأل عن استراتيجيات الاستثمار، نصائح الميزانية، أو خطط الادخار.', 'Ask about investment strategies, budgeting tips, or saving plans.')}
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-primary/20 shadow-lg relative bg-card/80 backdrop-blur-xl">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-6 pb-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-4 w-full",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <Avatar className={cn(
                  "w-10 h-10 border-2 shrink-0 shadow-sm",
                  msg.role === 'assistant' ? "border-primary bg-primary/10" : "border-muted bg-muted"
                )}>
                  {msg.role === 'assistant' ? (
                    <Bot className="w-5 h-5 m-auto text-primary" />
                  ) : (
                    <User className="w-5 h-5 m-auto text-muted-foreground" />
                  )}
                </Avatar>
                
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap",
                  msg.role === 'user' 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-muted text-foreground rounded-tl-none"
                )}>
                  {language === 'ar' ? msg.contentAr : msg.contentEn}
                </div>
              </div>
            ))}
            
            {sendMessage.isPending && (
              <div className="flex gap-4 w-full">
                <Avatar className="w-10 h-10 border-2 border-primary bg-primary/10 shrink-0 shadow-sm">
                  <Bot className="w-5 h-5 m-auto text-primary" />
                </Avatar>
                <div className="bg-muted text-foreground rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex gap-1.5 items-center">
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t">
          {/* Quick Suggestions */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {suggestions.map((s, i) => {
                const Icon = s.icon;
                const text = language === 'ar' ? s.ar : s.en;
                return (
                  <Button 
                    key={i} 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full bg-background border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground gap-2 transition-colors text-xs"
                    onClick={() => {
                      setInput(text);
                    }}
                  >
                    <Icon size={14} />
                    {text}
                  </Button>
                );
              })}
            </div>
          )}

          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('اكتب سؤالك هنا...', 'Type your question here...')}
              className="flex-1 rounded-full px-6 h-12 bg-muted/50 border-primary/20 focus-visible:ring-primary"
              disabled={sendMessage.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-12 w-12 rounded-full shrink-0 shadow-md"
              disabled={!input.trim() || sendMessage.isPending}
            >
              <Send size={20} className={cn("ml-0", language === 'ar' ? "rotate-180" : "")} />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
