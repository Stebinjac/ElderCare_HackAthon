'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pill, CheckCircle2, XCircle, Clock, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';

interface RefillItem {
    id: string;
    status: string;
    approved_days: number;
    doctor_notes: string | null;
    created_at: string;
    updated_at: string;
    medication: { name: string; dosage: string; frequency: string } | null;
    doctor: { name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    pending_doctor: { label: 'Waiting for Doctor', color: 'text-amber-500', icon: Clock },
    pending_patient: { label: 'Your Approval Needed', color: 'text-primary', icon: AlertTriangle },
    completed: { label: 'Refilled', color: 'text-green-600', icon: CheckCircle2 },
    doctor_denied: { label: 'Doctor Denied', color: 'text-red-500', icon: XCircle },
    patient_declined: { label: 'You Declined', color: 'text-red-400', icon: XCircle },
};

export default function PatientRefillsPage() {
    const [refills, setRefills] = useState<RefillItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isChecking, setIsChecking] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const hasChecked = useRef(false);

    const fetchRefills = async () => {
        try {
            const res = await fetch('/api/refills');
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

    useEffect(() => {
        // Auto-check ONCE on mount, then fetch refills
        const init = async () => {
            if (!hasChecked.current) {
                hasChecked.current = true;
                try {
                    await fetch('/api/refills', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'check' }),
                    });
                } catch (err) {
                    console.error('Auto-check failed:', err);
                }
            }
            await fetchRefills();
        };
        init();
    }, []);

    const checkMedications = async () => {
        setIsChecking(true);
        try {
            await fetch('/api/refills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check' }),
            });
            await fetchRefills();
        } catch (err) {
            console.error('Check failed:', err);
        } finally {
            setIsChecking(false);
        }
    };

    const handleConsent = async (refillId: string, consent: boolean) => {
        setActionLoading(refillId);
        try {
            await fetch('/api/refills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'patient-consent', refill_id: refillId, consent }),
            });
            // Just re-fetch refills, do NOT re-trigger a check (prevents duplicate)
            await fetchRefills();
        } catch (err) {
            console.error('Consent failed:', err);
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

    const pendingConsent = refills.filter(r => r.status === 'pending_patient');
    const activeRequests = refills.filter(r => r.status === 'pending_doctor');
    const history = refills.filter(r => !['pending_patient', 'pending_doctor'].includes(r.status));

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-foreground">Medication Refills</h1>
                    <p className="text-muted-foreground text-lg">Track and approve your prescription refills</p>
                </div>
                <Button
                    onClick={checkMedications}
                    disabled={isChecking}
                    className="h-12 px-6 rounded-2xl font-bold gap-2 shadow-lg"
                >
                    {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Check Medications
                </Button>
            </div>

            {/* Pending Consent Cards */}
            {pendingConsent.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Your Approval Needed
                    </h2>
                    {pendingConsent.map(refill => (
                        <Card key={refill.id} className="p-6 shadow-xl border-primary/30 bg-primary/5 rounded-[24px]">
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Pill className="w-5 h-5 text-primary" />
                                        <h3 className="text-xl font-bold text-foreground">
                                            {refill.medication?.name || 'Unknown Medication'}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {refill.medication?.dosage} • {refill.medication?.frequency}
                                    </p>
                                    <p className="text-sm text-foreground">
                                        Doctor recommends continuing for <span className="font-bold text-primary">{refill.approved_days} days</span>
                                    </p>
                                    {refill.doctor_notes && (
                                        <p className="text-xs text-muted-foreground italic bg-secondary/30 rounded-xl px-3 py-2 mt-2">
                                            Doctor&apos;s note: {refill.doctor_notes}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        onClick={() => handleConsent(refill.id, true)}
                                        disabled={actionLoading === refill.id}
                                        className="rounded-xl gap-1 bg-green-600 hover:bg-green-700 shadow-lg"
                                    >
                                        {actionLoading === refill.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        Approve
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleConsent(refill.id, false)}
                                        disabled={actionLoading === refill.id}
                                        className="rounded-xl gap-1 border-red-300 text-red-500 hover:bg-red-50"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Decline
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Waiting for Doctor */}
            {activeRequests.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-amber-500 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Waiting for Doctor
                    </h2>
                    {activeRequests.map(refill => (
                        <Card key={refill.id} className="p-5 rounded-[20px] shadow-sm border-amber-200/50 bg-amber-50/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-amber-100">
                                        <Pill className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground">{refill.medication?.name || 'Medication'}</h3>
                                        <p className="text-xs text-muted-foreground">
                                            {refill.medication?.dosage} • Requested {new Date(refill.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-amber-500 flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Awaiting Doctor
                                </span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Refill History */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-foreground">Refill History</h2>
                {history.length === 0 && pendingConsent.length === 0 && activeRequests.length === 0 ? (
                    <Card className="p-12 text-center rounded-[24px] bg-card/50">
                        <Pill className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">No refill requests yet.</p>
                        <p className="text-sm text-muted-foreground/60 mt-1">
                            Click &quot;Check Medications&quot; to scan for low supplies.
                        </p>
                    </Card>
                ) : (
                    history.map(refill => {
                        const config = STATUS_CONFIG[refill.status] || STATUS_CONFIG.pending_doctor;
                        const Icon = config.icon;
                        return (
                            <Card key={refill.id} className="p-5 rounded-[20px] shadow-sm border-border/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-primary/5">
                                            <Pill className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground">{refill.medication?.name || 'Medication'}</h3>
                                            <p className="text-xs text-muted-foreground">
                                                {refill.medication?.dosage} • {new Date(refill.updated_at || refill.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-sm font-bold ${config.color}`}>
                                        <Icon className="w-4 h-4" />
                                        {config.label}
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
