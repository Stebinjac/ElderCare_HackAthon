'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatBubble } from '@/components/agents/ChatBubble';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Send, Loader2, RefreshCw, Sparkles } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    mood?: string;
    suggestion?: string | null;
    timestamp?: string;
}

const greetingMessage: Message = {
    role: 'assistant',
    content: "Hello! 😊 I'm your Mental Wellness companion. I'm here to chat, listen, and support you. How are you feeling today? Don't hesitate to share anything on your mind — I'm here for you.",
    mood: 'positive',
    suggestion: null,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

const quickReplies = [
    "I'm feeling lonely today",
    "I'm anxious about my health",
    "I feel happy today!",
    "I haven't spoken to anyone in days",
    "I need some relaxation tips",
];

export default function MentalWellnessPage() {
    const [messages, setMessages] = useState<Message[]>([greetingMessage]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text?: string) => {
        const msgText = text ?? input.trim();
        if (!msgText || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: msgText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/agents/mental-wellness', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msgText, history }),
            });

            const data = await response.json();

            if (response.ok) {
                const assistantMessage: Message = {
                    role: 'assistant',
                    content: data.response,
                    mood: data.mood,
                    suggestion: data.suggestion,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                setMessages(prev => [...prev, assistantMessage]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "I'm so sorry, I had trouble responding just now. Please try again — I'm still here for you.",
                    mood: 'neutral',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }]);
            }
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'I seem to be having a connection issue. Please check your internet and try again.',
                mood: 'neutral',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const resetChat = () => {
        setMessages([{ ...greetingMessage, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setInput('');
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center">
                        <Brain className="w-6 h-6 text-violet-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-foreground">Mental Wellness Agent</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <p className="text-sm text-muted-foreground">Agent 1 · Emotional Support · Online</p>
                        </div>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={resetChat} className="gap-2 font-semibold">
                    <RefreshCw className="w-4 h-4" /> New Chat
                </Button>
            </div>

            {/* Info Banner */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <Sparkles className="w-5 h-5 text-violet-500 flex-shrink-0" />
                <p className="text-sm text-violet-700 dark:text-violet-300 font-medium">
                    This agent detects your emotional state and provides compassionate support. Share how you're feeling freely.
                </p>
            </div>

            {/* Chat Window */}
            <Card className="border-border/50 bg-card/50 backdrop-blur shadow-xl overflow-hidden flex flex-col" style={{ height: '520px' }}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {messages.map((msg, i) => (
                        <ChatBubble key={i} {...msg} />
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                                <Brain className="w-5 h-5 text-primary" />
                            </div>
                            <div className="px-5 py-3 rounded-2xl rounded-bl-sm bg-card border border-border/60 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                <span className="text-sm text-muted-foreground">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Quick Replies */}
                <div className="px-4 py-2 border-t border-border/30 flex gap-2 overflow-x-auto">
                    {quickReplies.map((reply) => (
                        <button
                            key={reply}
                            onClick={() => sendMessage(reply)}
                            disabled={isLoading}
                            className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary/70 hover:bg-secondary text-foreground/70 hover:text-foreground whitespace-nowrap transition-all border border-border/40 hover:border-primary/30 disabled:opacity-50"
                        >
                            {reply}
                        </button>
                    ))}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border/50 bg-background/50">
                    <div className="flex gap-3 items-end">
                        <Textarea
                            placeholder="Share how you're feeling..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            className="flex-1 resize-none bg-card border-border/60 focus:border-violet-500/60 min-h-[44px] max-h-32"
                        />
                        <Button
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || isLoading}
                            className="h-11 w-11 p-0 bg-violet-600 hover:bg-violet-700 flex-shrink-0"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-2">Press Enter to send · Shift+Enter for new line</p>
                </div>
            </Card>
        </div>
    );
}
