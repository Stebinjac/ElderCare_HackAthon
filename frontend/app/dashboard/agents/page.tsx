"use client"
import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Send, User, Loader2, MapPin, Calendar, AlertTriangle, Heart, Pill, Stethoscope } from 'lucide-react';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    actions?: ActionItem[];
}

interface ActionItem {
    tool: string;
    args: Record<string, any>;
    result: Record<string, any>;
}

const TOOL_ICONS: Record<string, any> = {
    find_nearest_hospital: MapPin,
    book_appointment: Calendar,
    send_emergency_alert: AlertTriangle,
    get_health_summary: Heart,
    get_medications: Pill,
    get_appointments: Stethoscope,
};

const TOOL_LABELS: Record<string, string> = {
    find_nearest_hospital: "Found Hospitals",
    book_appointment: "Booked Appointment",
    send_emergency_alert: "Sent Alert",
    get_health_summary: "Health Summary",
    get_medications: "Medications",
    get_appointments: "Appointments",
};

function ActionCard({ action }: { action: ActionItem }) {
    const Icon = TOOL_ICONS[action.tool] || Bot;
    const label = TOOL_LABELS[action.tool] || action.tool;

    return (
        <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                    <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{label}</span>
            </div>
            <div className="text-sm text-muted-foreground">
                {action.tool === "book_appointment" && action.result.success && (
                    <div className="space-y-1">
                        <p className="font-medium text-foreground">Dr. {action.result.doctor_name}</p>
                        <p>{action.result.date} at {action.result.time}</p>
                        <p className="text-xs">Status: {action.result.status}</p>
                    </div>
                )}
                {action.tool === "find_nearest_hospital" && action.result.hospitals && (
                    <div className="space-y-2">
                        {action.result.hospitals.slice(0, 3).map((h: any, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                                <MapPin className="w-3 h-3 mt-1 text-primary shrink-0" />
                                <div>
                                    <p className="font-medium text-foreground">{h.name}</p>
                                    {h.maps_link && (
                                        <a href={h.maps_link} target="_blank" rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline">
                                            Open in Google Maps
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {action.tool === "send_emergency_alert" && (
                    <p className={action.result.success ? "text-green-600" : "text-red-500"}>
                        {action.result.success ? `Alert sent to ${action.result.sent_to}` : action.result.error}
                    </p>
                )}
                {action.tool === "get_health_summary" && action.result.latest_vitals && (
                    <div className="grid grid-cols-2 gap-2">
                        <div><span className="font-medium">BP:</span> {action.result.latest_vitals.bp_systolic}/{action.result.latest_vitals.bp_diastolic}</div>
                        <div><span className="font-medium">HR:</span> {action.result.latest_vitals.heart_rate} bpm</div>
                        <div><span className="font-medium">SpO2:</span> {action.result.latest_vitals.spo2}%</div>
                    </div>
                )}
                {action.tool === "get_appointments" && action.result.appointments && (
                    <p>{action.result.total} appointment(s) found</p>
                )}
                {action.tool === "get_medications" && (
                    <p>{action.result.count} medication(s) on file</p>
                )}
            </div>
        </div>
    );
}

const SUGGESTIONS = [
    "What are my latest vitals?",
    "Book an appointment with my doctor",
    "Find the nearest hospital",
    "Send an emergency alert",
    "List my upcoming appointments",
    "What medications am I taking?",
];

export default function AgentCarePage() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text?: string) => {
        const msg = text || input.trim();
        if (!msg || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: msg };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, content: m.content }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, history }),
            });

            if (!res.ok) {
                throw new Error('Failed to get response');
            }

            const data = await res.json();

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: data.response,
                actions: data.actions,
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please make sure the backend server is running at localhost:8000.',
            }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] max-w-3xl mx-auto">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                        <div className="p-6 rounded-full bg-primary/10 shadow-lg">
                            <Bot className="w-12 h-12 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">AgentCare AI</h2>
                            <p className="text-muted-foreground max-w-md">
                                I can check your vitals, book appointments with doctors, find nearby hospitals, and send emergency alerts. Just ask!
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                            {SUGGESTIONS.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(s)}
                                    className="p-3 text-sm text-left rounded-xl border border-border hover:bg-primary/5 hover:border-primary/30 transition-all text-muted-foreground hover:text-foreground"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                                    <Bot className="w-4 h-4 text-primary" />
                                </div>
                            )}
                            <div className={`max-w-[80%] ${msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3'
                                : 'bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm'
                                }`}>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                {msg.actions && msg.actions.length > 0 && (
                                    <div className="space-y-2 mt-2">
                                        {msg.actions.map((a, j) => (
                                            <ActionCard key={j} action={a} />
                                        ))}
                                    </div>
                                )}
                            </div>
                            {msg.role === 'user' && (
                                <div className="shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center mt-1">
                                    <User className="w-4 h-4 text-primary-foreground" />
                                </div>
                            )}
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="flex gap-3">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Thinking & executing actions...</span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="border-t border-border pt-4">
                <form
                    onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                    className="flex items-center gap-3"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Ask AgentCare anything..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                        className="flex-1 h-12 px-4 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-base"
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="h-12 w-12 rounded-xl p-0 bg-primary hover:bg-primary/90 shadow-lg"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
