'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VitalInput } from '@/components/agents/VitalInput';
import { Activity, Siren, AlertTriangle, CheckCircle2, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface VitalResult {
    name: string;
    value: string;
    status: 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL';
    statusLabel: string;
    normalRange: string;
    interpretation: string;
    recommendation: string;
}

interface HealthAnalysis {
    overallAlertLevel: 'NORMAL' | 'CAUTION' | 'WARNING' | 'CRITICAL';
    requiresEmergency: boolean;
    summary: string;
    vitals: VitalResult[];
    recommendations: string[];
    emergencyReason: string | null;
}

const alertConfig = {
    NORMAL: { label: 'All Normal', color: 'text-emerald-600', bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2, iconColor: 'text-emerald-500' },
    CAUTION: { label: 'Caution', color: 'text-amber-600', bg: 'bg-amber-500/10 border-amber-500/30', icon: AlertTriangle, iconColor: 'text-amber-500' },
    WARNING: { label: 'Warning', color: 'text-orange-600', bg: 'bg-orange-500/10 border-orange-500/30', icon: AlertTriangle, iconColor: 'text-orange-500' },
    CRITICAL: { label: 'Critical — Immediate Action Needed!', color: 'text-rose-600', bg: 'bg-rose-500/10 border-rose-500/30', icon: Siren, iconColor: 'text-rose-500' },
};

const vitalStatusConfig = {
    NORMAL: { color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
    LOW: { color: 'text-sky-600', bg: 'bg-sky-500/10', icon: TrendingDown },
    HIGH: { color: 'text-amber-600', bg: 'bg-amber-500/10', icon: TrendingUp },
    CRITICAL: { color: 'text-rose-600', bg: 'bg-rose-500/10', icon: AlertTriangle },
};

export default function HealthMonitoringPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [analysis, setAnalysis] = useState<HealthAnalysis | null>(null);
    const [currentVitals, setCurrentVitals] = useState<Record<string, number>>({});
    const router = useRouter();

    const handleVitalsSubmit = async (vitals: Record<string, number>) => {
        setIsLoading(true);
        setAnalysis(null);
        setCurrentVitals(vitals);

        try {
            const response = await fetch('/api/agents/health-monitoring', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vitals),
            });

            const data = await response.json();
            if (response.ok && data.data) {
                setAnalysis(data.data);
            }
        } catch {
            // fail silently
        } finally {
            setIsLoading(false);
        }
    };

    const handleEscalate = () => {
        if (analysis) {
            sessionStorage.setItem('healthAnalysis', JSON.stringify(analysis));
            sessionStorage.setItem('currentVitals', JSON.stringify(currentVitals));
            router.push('/dashboard/agents/emergency');
        }
    };

    const alertLevel = analysis ? alertConfig[analysis.overallAlertLevel] : null;
    const AlertIcon = alertLevel?.icon ?? CheckCircle2;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-extrabold text-foreground">Health Monitoring Agent</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <p className="text-sm text-muted-foreground">Agent 3 · Vitals Analysis · Online</p>
                    </div>
                </div>
            </div>

            {/* Vitals Input */}
            <Card className="p-7 border-border/50 bg-card/50 backdrop-blur shadow-xl">
                <h3 className="font-bold text-foreground mb-1 text-lg">Enter Vital Signs</h3>
                <p className="text-sm text-muted-foreground mb-6">Fill in any available measurements — you don&apos;t need all of them.</p>
                <VitalInput onSubmit={handleVitalsSubmit} isLoading={isLoading} />
            </Card>

            {/* Analysis Results */}
            {analysis && alertLevel && (
                <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-400">
                    {/* Overall Alert Banner */}
                    <Card className={cn('p-6 border-2 shadow-xl', alertLevel.bg)}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', alertLevel.bg)}>
                                    <AlertIcon className={cn('w-6 h-6', alertLevel.iconColor)} />
                                </div>
                                <div>
                                    <p className={cn('text-lg font-extrabold', alertLevel.color)}>{alertLevel.label}</p>
                                    <p className="text-sm text-foreground/70 mt-0.5">{analysis.summary}</p>
                                </div>
                            </div>
                            {analysis.requiresEmergency && (
                                <Button
                                    onClick={handleEscalate}
                                    className="bg-rose-600 hover:bg-rose-700 font-bold gap-2 animate-pulse hover:animate-none shadow-lg"
                                >
                                    <Siren className="w-5 h-5" />
                                    Escalate to Emergency Agent
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                        {analysis.emergencyReason && (
                            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                                <p className="text-sm text-rose-700 dark:text-rose-300 font-semibold">⚠️ {analysis.emergencyReason}</p>
                            </div>
                        )}
                    </Card>

                    {/* Vital Results Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analysis.vitals.map((vital, i) => {
                            const cfg = vitalStatusConfig[vital.status];
                            const StatusIcon = cfg.icon;
                            return (
                                <Card key={i} className={cn('p-5 border shadow-md hover:shadow-lg transition-shadow', vital.status === 'CRITICAL' ? 'border-rose-500/40' : 'border-border/50')}>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{vital.name}</p>
                                        <span className={cn('text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1', cfg.bg, cfg.color)}>
                                            <StatusIcon className="w-3 h-3" /> {vital.statusLabel}
                                        </span>
                                    </div>
                                    <p className="text-3xl font-black text-foreground mb-1">{vital.value}</p>
                                    <p className="text-xs text-muted-foreground mb-3">Normal: {vital.normalRange}</p>
                                    <p className="text-xs text-foreground/70 leading-relaxed">{vital.interpretation}</p>
                                    {vital.recommendation && (
                                        <div className="mt-3 pt-3 border-t border-border/40">
                                            <p className="text-xs text-primary font-semibold">{vital.recommendation}</p>
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>

                    {/* Overall Recommendations */}
                    {analysis.recommendations?.length > 0 && (
                        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur shadow-md">
                            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                <Minus className="w-4 h-4 text-primary" /> Overall Recommendations
                            </h3>
                            <ul className="space-y-2">
                                {analysis.recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
                                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                        {rec}
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
