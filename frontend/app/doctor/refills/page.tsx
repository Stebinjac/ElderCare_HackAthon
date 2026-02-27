'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pill, CheckCircle2, XCircle, Loader2, Heart, AlertTriangle, Clock } from 'lucide-react';

interface RefillRequest {
    id: string;
    status: string;
    approved_days: number;
    health_summary: {
        patient_name: string;
        vitals: { heart_rate: number; spo2: number; bp_systolic: number; bp_diastolic: number } | null;
        risk_level: string;
        medications: { name: string; dosage: string; remaining_days: number }[];
    } | null;
    created_at: string;
    medication: { name: string; dosage: string; frequency: string } | null;
    patient: { name: string; email: string } | null;
}

export default function DoctorRefillsPage() {
    const [refills, setRefills] = useState<RefillRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [approvedDays, setApprovedDays] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});

    const fetchRefills = async () => {
        try {
            const meRes = await fetch('/api/auth/me');
            const meData = await meRes.json();
            if (!meRes.ok) return;

            const res = await fetch(`/api/refills?role=doctor`);
            if (res.ok) {
                const data = await res.json();
                setRefills(data.refills || []);
            }
        } catch (err) {
            console.error('Failed to fetch refills:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchRefills(); }, []);

    const handleDecision = async (refillId: string, decision: string, defaultDays: number) => {
        setActionLoading(refillId);
        try {
            await fetch('/api/refills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'doctor-decision',
                    refill_id: refillId,
                    decision,
                    approved_days: approvedDays[refillId] ?? defaultDays ?? 30,
                    notes: notes[refillId] || null,
                }),
            });
            await fetchRefills();
        } catch (err) {
            console.error('Decision failed:', err);
        } finally {
            setActionLoading(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    const RISK_COLORS: Record<string, string> = {
        low: 'text-green-600 bg-green-500/10',
        moderate: 'text-amber-600 bg-amber-500/10',
        high: 'text-red-600 bg-red-500/10',
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tight text-foreground">Refill Requests</h1>
                <p className="text-muted-foreground text-lg">Review and approve medication refills for your patients</p>
            </div>

            {refills.length === 0 ? (
                <Card className="p-12 text-center rounded-[24px] bg-card/50">
                    <Pill className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">No pending refill requests.</p>
                </Card>
            ) : (
                <div className="space-y-6">
                    {refills.map(refill => {
                        const summary = refill.health_summary;
                        const riskLevel = summary?.risk_level || 'low';
                        const riskClass = RISK_COLORS[riskLevel] || RISK_COLORS.low;

                        return (
                            <Card key={refill.id} className="rounded-[24px] shadow-xl overflow-hidden border-border/50">
                                {/* Header */}
                                <div className="px-6 py-4 bg-linear-to-r from-primary/5 to-transparent flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-primary/10">
                                            <Pill className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-foreground">
                                                {refill.medication?.name || 'Unknown Medication'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Patient: <span className="font-semibold text-foreground">{refill.patient?.name || 'Unknown'}</span>
                                                {' • '}{refill.medication?.dosage} • {refill.medication?.frequency}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${riskClass}`}>
                                        {riskLevel} risk
                                    </span>
                                </div>

                                {/* Health Summary */}
                                {summary?.vitals && (
                                    <div className="px-6 py-3 border-t border-border/30">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <Heart className="w-3 h-3" /> Patient Vitals
                                        </p>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">BP:</span>{' '}
                                                <span className="font-bold">{summary.vitals.bp_systolic}/{summary.vitals.bp_diastolic}</span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">HR:</span>{' '}
                                                <span className="font-bold">{summary.vitals.heart_rate} bpm</span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="text-muted-foreground">SpO2:</span>{' '}
                                                <span className="font-bold">{summary.vitals.spo2}%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="px-6 py-4 border-t border-border/30 space-y-3">
                                    <div className="flex gap-3">
                                        <div className="flex-1">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Continue for (days)</label>
                                            <select
                                                className="w-full mt-1 h-10 px-3 rounded-xl border border-border bg-secondary/30 text-sm font-bold appearance-none cursor-pointer"
                                                value={approvedDays[refill.id] || refill.approved_days || 30}
                                                onChange={e => setApprovedDays(prev => ({ ...prev, [refill.id]: parseInt(e.target.value) }))}
                                            >
                                                {[2, 7, 10, 14, 15, 21, 30, 45, 60, 90].map(d => (
                                                    <option key={d} value={d}>{d} days</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes (optional)</label>
                                            <input
                                                type="text"
                                                className="w-full mt-1 h-10 px-3 rounded-xl border border-border bg-secondary/30 text-sm"
                                                placeholder="Reduce dosage if needed..."
                                                value={notes[refill.id] || ''}
                                                onChange={e => setNotes(prev => ({ ...prev, [refill.id]: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            onClick={() => handleDecision(refill.id, 'deny', refill.approved_days)}
                                            disabled={actionLoading === refill.id}
                                            variant="outline"
                                            className="rounded-xl gap-1 border-red-300 text-red-500 hover:bg-red-50"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Deny
                                        </Button>
                                        <Button
                                            onClick={() => handleDecision(refill.id, 'approve', refill.approved_days)}
                                            disabled={actionLoading === refill.id}
                                            className="rounded-xl gap-1 bg-green-600 hover:bg-green-700 shadow-lg"
                                        >
                                            {actionLoading === refill.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Approve Refill
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
