"use client"
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Activity, Heart, Clock, CheckCircle, TrendingUp, Bell } from 'lucide-react';

interface Alert {
    id: string;
    type: string;
    severity: string;
    payload: any;
    resolved: boolean;
    triggered_at: string;
    patient?: { name: string };
}

interface WellnessPoint { date: string; score: number; }

export default function GuardianDashboard() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [wellnessTrend, setWellnessTrend] = useState<WellnessPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/guardian/dashboard')
            .then(r => r.json())
            .then(d => {
                setAlerts(d.alerts || []);
                setWellnessTrend(d.wellnessTrend || []);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'border-red-500 bg-red-500/10 text-red-400';
            case 'HIGH': return 'border-orange-500 bg-orange-500/10 text-orange-400';
            case 'MEDIUM': return 'border-yellow-500 bg-yellow-500/10 text-yellow-400';
            default: return 'border-blue-500 bg-blue-500/10 text-blue-400';
        }
    };

    const unresolved = alerts.filter(a => !a.resolved);
    const resolved = alerts.filter(a => a.resolved);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Guardian Dashboard</h1>
                <p className="text-muted-foreground mt-1">Monitor your patient's health status and alerts in real time.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-red-500/20 bg-red-500/5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
                        <p className="text-muted-foreground">Active Alerts</p>
                    </div>
                    <p className="text-4xl font-bold text-red-400">{unresolved.length}</p>
                </Card>
                <Card className="p-6 border-green-500/20 bg-green-500/5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-500/10 rounded-lg"><CheckCircle className="w-5 h-5 text-green-400" /></div>
                        <p className="text-muted-foreground">Resolved</p>
                    </div>
                    <p className="text-4xl font-bold text-green-400">{resolved.length}</p>
                </Card>
                <Card className="p-6 border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg"><Heart className="w-5 h-5 text-primary" /></div>
                        <p className="text-muted-foreground">Wellness Score</p>
                    </div>
                    <p className="text-4xl font-bold text-primary">
                        {wellnessTrend.length > 0 ? `${wellnessTrend[wellnessTrend.length - 1]?.score}/10` : 'N/A'}
                    </p>
                </Card>
            </div>

            {/* Active Alerts */}
            <Card className="p-8 shadow-xl border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center gap-3 mb-6">
                    <Bell className="w-6 h-6 text-red-400" />
                    <h2 className="text-2xl font-bold text-foreground">Active Alerts</h2>
                </div>
                {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
                ) : unresolved.length === 0 ? (
                    <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                        <p className="text-muted-foreground">No active alerts. Patient is stable.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {unresolved.map((alert) => (
                            <div key={alert.id} className={`border rounded-xl p-5 ${getSeverityColor(alert.severity)}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span className="font-bold text-sm uppercase tracking-wider">{alert.severity}</span>
                                        </div>
                                        <p className="font-semibold text-foreground">{alert.type.replace(/_/g, ' ')}</p>
                                        {alert.payload?.message && (
                                            <p className="text-sm mt-1 opacity-80">{alert.payload.message}</p>
                                        )}
                                        {alert.payload?.bp_systolic && (
                                            <p className="text-sm mt-1 opacity-80">
                                                BP: {alert.payload.bp_systolic}/{alert.payload.bp_diastolic} mmHg · HR: {alert.payload.heart_rate} bpm
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <Clock className="w-4 h-4 ml-auto mb-1 opacity-60" />
                                        <p className="text-xs opacity-60">{new Date(alert.triggered_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Wellness Trend */}
            <Card className="p-8 shadow-xl border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-foreground">Wellness Trend (Last 7 Days)</h2>
                </div>
                {wellnessTrend.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No wellness check-in data available yet.</p>
                ) : (
                    <div className="flex items-end gap-3 h-32">
                        {wellnessTrend.map((point, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                    className={`w-full rounded-t transition-all ${point.score >= 7 ? 'bg-green-500' : point.score >= 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ height: `${(point.score / 10) * 100}%` }}
                                />
                                <p className="text-xs text-muted-foreground">{point.date}</p>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Alert History */}
            {resolved.length > 0 && (
                <Card className="p-8 shadow-xl border-border/50 bg-card/50 backdrop-blur">
                    <h2 className="text-2xl font-bold text-foreground mb-6">Alert History</h2>
                    <div className="space-y-3">
                        {resolved.map((alert) => (
                            <div key={alert.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <div>
                                        <p className="font-medium text-foreground">{alert.type.replace(/_/g, ' ')}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(alert.triggered_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">Resolved</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
