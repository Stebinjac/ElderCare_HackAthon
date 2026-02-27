'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Siren, Ambulance, Hospital, Clock, AlertTriangle, CheckCircle2, ChevronRight, MessageSquare, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface EmergencyDecision {
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    severityLabel: string;
    emergencyType: string;
    ambulanceRequired: boolean;
    ambulanceUrgency: string;
    hospitalType: string;
    hospitalReason: string;
    immediateActions: string[];
    medicalSummary: string;
    decisionRationale: string;
    estimatedTimeframeMinutes: number;
}

const severityConfig = {
    LOW: { label: 'Low', color: 'text-emerald-600', bg: 'from-emerald-500/20 to-emerald-500/5', border: 'border-emerald-500/30', badge: 'bg-emerald-500/15 text-emerald-600' },
    MEDIUM: { label: 'Medium', color: 'text-amber-600', bg: 'from-amber-500/20 to-amber-500/5', border: 'border-amber-500/30', badge: 'bg-amber-500/15 text-amber-600' },
    HIGH: { label: 'High', color: 'text-orange-600', bg: 'from-orange-500/20 to-orange-500/5', border: 'border-orange-500/30', badge: 'bg-orange-500/15 text-orange-600' },
    CRITICAL: { label: 'CRITICAL', color: 'text-rose-600', bg: 'from-rose-500/25 to-rose-500/5', border: 'border-rose-500/40', badge: 'bg-rose-500/20 text-rose-600' },
};

export default function EmergencyPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [decision, setDecision] = useState<EmergencyDecision | null>(null);
    const [hasData, setHasData] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const storedAnalysis = sessionStorage.getItem('healthAnalysis');
        const storedVitals = sessionStorage.getItem('currentVitals');
        if (storedAnalysis && storedVitals) {
            setHasData(true);
            handleEvaluate(JSON.parse(storedAnalysis), JSON.parse(storedVitals));
        }
    }, []);

    const handleEvaluate = async (healthData: unknown, vitals: unknown) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/agents/emergency-decision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ healthData, vitals }),
            });
            const data = await response.json();
            if (response.ok && data.data) {
                setDecision(data.data);
                sessionStorage.setItem('emergencyDecision', JSON.stringify(data.data));
            }
        } catch {
            // fail silently
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotify = () => {
        router.push('/dashboard/agents/communication');
    };

    const sev = decision ? severityConfig[decision.severity] : null;

    if (!hasData && !isLoading && !decision) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center">
                        <Siren className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-foreground">Emergency Decision Agent</h2>
                        <p className="text-sm text-muted-foreground">Agent 4 · Autonomous Emergency Response · Standby</p>
                    </div>
                </div>
                <Card className="p-12 border-dashed border-2 border-rose-500/20 bg-rose-500/5 text-center shadow-md">
                    <Siren className="w-12 h-12 text-rose-400 mx-auto mb-4 opacity-60" />
                    <h3 className="text-xl font-bold text-foreground mb-2">No Active Emergency</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">This agent activates when a critical health condition is detected. Go to Health Monitoring, enter vitals, and escalate if a critical condition is found.</p>
                    <Link href="/dashboard/agents/health-monitoring">
                        <Button className="gap-2 bg-primary hover:bg-primary/90 font-bold">
                            Go to Health Monitoring <ChevronRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center">
                        <Siren className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold text-foreground">Emergency Decision Agent</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                            <p className="text-sm text-muted-foreground">Agent 4 · Emergency Active</p>
                        </div>
                    </div>
                </div>
                <Link href="/dashboard/agents/health-monitoring">
                    <Button variant="outline" size="sm" className="gap-2 font-semibold">
                        <ArrowLeft className="w-4 h-4" /> Back to Monitoring
                    </Button>
                </Link>
            </div>

            {isLoading && (
                <Card className="p-10 text-center border-rose-500/20 bg-rose-500/5 shadow-md">
                    <Siren className="w-10 h-10 text-rose-500 mx-auto mb-4 animate-bounce" />
                    <p className="font-bold text-foreground text-lg">Emergency Agent Evaluating Situation...</p>
                    <p className="text-muted-foreground mt-1">Analyzing vitals and determining best course of action</p>
                </Card>
            )}

            {decision && sev && (
                <div className="space-y-5">
                    {/* Severity Card */}
                    <Card className={cn('p-7 bg-gradient-to-br border-2 shadow-2xl', sev.bg, sev.border)}>
                        <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
                            <div>
                                <span className={cn('text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full', sev.badge)}>
                                    Severity: {sev.label}
                                </span>
                                <h3 className={cn('text-2xl font-extrabold mt-3', sev.color)}>{decision.severityLabel}</h3>
                                <p className="text-foreground/70 text-sm mt-1">{decision.emergencyType}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">Recommended Response Time</p>
                                <p className={cn('text-3xl font-black', sev.color)}>{decision.estimatedTimeframeMinutes} min</p>
                            </div>
                        </div>

                        {/* Key Decision Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl bg-background/60 backdrop-blur border border-border/30">
                                <div className="flex items-center gap-2 mb-1">
                                    <Ambulance className="w-4 h-4 text-rose-500" />
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Ambulance</p>
                                </div>
                                <p className={cn('font-extrabold text-lg', decision.ambulanceRequired ? 'text-rose-600' : 'text-emerald-600')}>
                                    {decision.ambulanceRequired ? 'Required' : 'Not Required'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">{decision.ambulanceUrgency.replace(/_/g, ' ')}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-background/60 backdrop-blur border border-border/30">
                                <div className="flex items-center gap-2 mb-1">
                                    <Hospital className="w-4 h-4 text-primary" />
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Hospital Type</p>
                                </div>
                                <p className="font-extrabold text-lg text-foreground">{decision.hospitalType}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{decision.hospitalReason}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-background/60 backdrop-blur border border-border/30 col-span-2 md:col-span-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-amber-500" />
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Urgency</p>
                                </div>
                                <p className={cn('font-extrabold text-lg', sev.color)}>{decision.severity}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Emergency Classification</p>
                            </div>
                        </div>
                    </Card>

                    {/* Immediate Actions */}
                    <Card className="p-6 border-rose-500/30 bg-rose-500/5 shadow-md">
                        <h3 className="font-extrabold text-foreground mb-4 flex items-center gap-2 text-lg">
                            <AlertTriangle className="w-5 h-5 text-rose-500" /> Immediate Actions Required NOW
                        </h3>
                        <div className="space-y-3">
                            {decision.immediateActions.map((action, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-background/60 border border-rose-500/20">
                                    <span className="w-7 h-7 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                    <p className="text-sm text-foreground font-medium">{action}</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Medical Summary */}
                    <Card className="p-6 border-border/50 bg-card/60 backdrop-blur shadow-md">
                        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-primary" /> Medical Summary for First Responders
                        </h3>
                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
                            <p className="text-sm text-foreground leading-relaxed font-medium">{decision.medicalSummary}</p>
                        </div>
                        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs text-primary font-semibold">Decision Rationale: {decision.decisionRationale}</p>
                        </div>
                    </Card>

                    {/* Notify Action */}
                    <Button
                        onClick={handleNotify}
                        className="w-full h-14 text-lg font-extrabold bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 gap-3 shadow-2xl hover:shadow-rose-500/30 transition-all"
                    >
                        <MessageSquare className="w-6 h-6" />
                        Notify Family & Hospital via Communication Agent
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            )}
        </div>
    );
}
