'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardCheck, Send, Loader2, Lightbulb, AlertCircle, CheckCircle2, Clock, Pill } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssistantResponse {
    response: string;
    category: string;
    actionItems: string[];
    urgency: 'low' | 'medium' | 'high';
    tips: string[];
}

const urgencyConfig = {
    low: { label: 'Low Priority', color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    medium: { label: 'Moderate Priority', color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/30' },
    high: { label: 'High Priority', color: 'text-rose-600', bg: 'bg-rose-500/10 border-rose-500/30' },
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    medication: Pill,
    appointment: Clock,
    prescription: ClipboardCheck,
    reminder: Clock,
    health_query: Lightbulb,
    general: CheckCircle2,
};

const suggestionQueries = [
    'When should I take my blood pressure medication?',
    'What are the side effects of metformin?',
    'How do I prepare for a blood test?',
    'Remind me about my daily exercises',
    'What foods should I avoid with diabetes?',
    'How often should I check my blood pressure?',
];

export default function PersonalAssistantPage() {
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AssistantResponse | null>(null);
    const [history, setHistory] = useState<{ query: string; result: AssistantResponse }[]>([]);

    const handleSubmit = async (q?: string) => {
        const text = q ?? query.trim();
        if (!text || isLoading) return;

        setIsLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/agents/personal-assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text }),
            });

            const data = await response.json();
            if (response.ok && data.data) {
                setResult(data.data);
                setHistory(prev => [{ query: text, result: data.data }, ...prev.slice(0, 4)]);
            }
        } catch {
            // fail silently
        } finally {
            setIsLoading(false);
            setQuery('');
        }
    };

    const CategoryIcon = result ? (categoryIcons[result.category] || ClipboardCheck) : ClipboardCheck;
    const urgency = result ? urgencyConfig[result.urgency] : null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
                    <ClipboardCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold text-foreground">Personal Assistant Agent</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <p className="text-sm text-muted-foreground">Agent 2 · Health Tasks · Online</p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Query Panel */}
                <div className="lg:col-span-2 space-y-5">
                    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur shadow-xl">
                        <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                            <Send className="w-4 h-4 text-emerald-500" /> Ask Your Assistant
                        </h3>
                        <Textarea
                            placeholder="Ask about medications, appointments, prescriptions, or daily health tasks..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            rows={4}
                            className="resize-none bg-background border-border/60 focus:border-emerald-500/60 mb-4"
                        />
                        <Button
                            onClick={() => handleSubmit()}
                            disabled={!query.trim() || isLoading}
                            className="w-full h-12 font-bold bg-emerald-600 hover:bg-emerald-700 gap-2"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            {isLoading ? 'Processing...' : 'Ask Assistant'}
                        </Button>
                    </Card>

                    {/* Result */}
                    {result && (
                        <Card className="p-6 border-emerald-500/30 bg-card shadow-xl animate-in zoom-in-95 duration-300">
                            <div className="flex items-start justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                                        <CategoryIcon className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            {result.category.replace('_', ' ')}
                                        </p>
                                        <p className="font-bold text-foreground">Assistant Response</p>
                                    </div>
                                </div>
                                {urgency && (
                                    <span className={cn('text-xs font-bold px-3 py-1 rounded-full border', urgency.color, urgency.bg)}>
                                        {urgency.label}
                                    </span>
                                )}
                            </div>

                            <p className="text-foreground leading-relaxed mb-5">{result.response}</p>

                            {result.actionItems?.length > 0 && (
                                <div className="mb-4">
                                    <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Action Items
                                    </p>
                                    <ul className="space-y-2">
                                        {result.actionItems.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.tips?.length > 0 && (
                                <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
                                    <p className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                                        <Lightbulb className="w-4 h-4 text-amber-500" /> Health Tips
                                    </p>
                                    {result.tips.map((tip, i) => (
                                        <p key={i} className="text-sm text-muted-foreground">{tip}</p>
                                    ))}
                                </div>
                            )}
                        </Card>
                    )}
                </div>

                {/* Sidebar: Suggestions + History */}
                <div className="space-y-5">
                    <Card className="p-5 border-border/50 bg-card/50 backdrop-blur shadow-md">
                        <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500" /> Suggested Questions
                        </h4>
                        <div className="space-y-2">
                            {suggestionQueries.map((q) => (
                                <button
                                    key={q}
                                    onClick={() => handleSubmit(q)}
                                    disabled={isLoading}
                                    className="w-full text-left text-sm px-3 py-2.5 rounded-lg bg-secondary/50 hover:bg-secondary text-foreground/70 hover:text-foreground transition-all border border-border/30 hover:border-emerald-500/30 disabled:opacity-50"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </Card>

                    {history.length > 0 && (
                        <Card className="p-5 border-border/50 bg-card/50 backdrop-blur shadow-md">
                            <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-primary" /> Recent Queries
                            </h4>
                            <div className="space-y-2">
                                {history.map((item, i) => (
                                    <div key={i} className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                                        <p className="text-xs font-semibold text-foreground/80 truncate">{item.query}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{item.result.category.replace('_', ' ')}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
