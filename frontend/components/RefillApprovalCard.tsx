'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill, CheckCircle, XCircle, FileText, Loader2, AlertCircle } from 'lucide-react';

interface RefillApprovalCardProps {
    refill: {
        id: string;
        status: string;
        medications?: {
            name: string;
        };
        health_report?: any;
    };
    role: 'patient' | 'doctor';
    onApprove: (id: string) => Promise<void>;
    onReject?: (id: string) => Promise<void>;
}

export default function RefillApprovalCard({ refill, role, onApprove, onReject }: RefillApprovalCardProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReport, setShowReport] = useState(false);

    const handleApprove = async () => {
        setIsProcessing(true);
        try {
            await onApprove(refill.id);
        } finally {
            setIsProcessing(false);
        }
    };

    const statusMap: Record<string, { label: string; color: string }> = {
        'pending': { label: 'Needs Approval', color: 'bg-amber-500/10 text-amber-600' },
        'approved_by_doctor': { label: 'Doctor Approved', color: 'bg-blue-500/10 text-blue-600' },
        'approved_by_patient': { label: 'Patient Approved', color: 'bg-purple-500/10 text-purple-600' },
        'completed': { label: 'Restocked', color: 'bg-emerald-500/10 text-emerald-600' },
    };

    const currentStatus = statusMap[refill.status] || { label: refill.status, color: 'bg-muted text-muted-foreground' };

    return (
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur shadow-lg rounded-[32px] overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Pill className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold text-foreground">{(refill as any).medications?.name || 'Unknown Medication'}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${currentStatus.color}`}>
                                {currentStatus.label}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {role === 'doctor' && refill.health_report && (
                        <Button
                            variant="outline"
                            className="h-12 rounded-xl border-2 font-bold flex items-center gap-2"
                            onClick={() => setShowReport(!showReport)}
                        >
                            <FileText className="w-5 h-5" />
                            {showReport ? 'Hide Report' : 'View Health Report'}
                        </Button>
                    )}

                    <Button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2"
                    >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                        Approve Refill
                    </Button>

                    {onReject && (
                        <Button
                            variant="ghost"
                            className="h-12 w-12 p-0 text-destructive hover:bg-destructive/10 rounded-xl"
                            onClick={() => onReject(refill.id)}
                        >
                            <XCircle className="w-6 h-6" />
                        </Button>
                    )}
                </div>
            </div>

            {showReport && refill.health_report && (
                <div className="mt-6 p-6 bg-secondary/30 rounded-2xl border border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <h5 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">Autonomous Health Status Report</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase">Recent Vitals Summary</p>
                            <div className="p-3 bg-card rounded-xl border border-border/30">
                                {refill.health_report.recent_vitals?.length > 0 ? (
                                    <div className="flex gap-4">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase">Latest HR</p>
                                            <p className="text-lg font-bold">{refill.health_report.recent_vitals[0].heart_rate}</p>
                                        </div>
                                        <div className="text-center border-l pl-4">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase">SpO2</p>
                                            <p className="text-lg font-bold">{refill.health_report.recent_vitals[0].spo2}%</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm italic text-muted-foreground">No recent vitals found.</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-muted-foreground uppercase">Current Medications</p>
                            <div className="p-3 bg-card rounded-xl border border-border/30 max-h-32 overflow-y-auto">
                                {refill.health_report.current_medications?.map((m: any, idx: number) => (
                                    <div key={idx} className="text-sm font-medium border-b border-border/30 last:border-0 py-1">
                                        {m.name} - {m.dosage}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
