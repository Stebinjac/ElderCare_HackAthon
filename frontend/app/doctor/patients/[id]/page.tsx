'use client';

import { useState, useEffect, use } from 'react';
import { Card } from '@/components/ui/card';
import {
    Users, Heart, Activity, FileText, CheckCircle2,
    Loader2, Table as TableIcon, ArrowLeft, Pill,
    Plus, ClipboardList, Info, AlertCircle
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SmartwatchVitalsCard } from '@/components/SmartwatchVitalsCard';
import Link from 'next/link';

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [isLoading, setIsLoading] = useState(true);
    const [patient, setPatient] = useState<any>(null);
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

    // Form state for new prescription
    const [medication, setMedication] = useState('');
    const [dosage, setDosage] = useState('');
    const [instructions, setInstructions] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch patient details and their reports/metrics through the doctor API
                // For now we use the general patients list and filter, but ideally a specific endpoint
                const patientsRes = await fetch('/api/doctor/patients');
                const drugsRes = await fetch(`/api/prescriptions?patientId=${id}`);

                const patientsData = await patientsRes.json();
                const drugsData = await drugsRes.json();

                if (patientsRes.ok) {
                    const currentPatient = patientsData.patients.find((p: any) => p.id === id);
                    // Also fetch their latest report data specifically
                    if (currentPatient) {
                        // We'll need a way for doctor to see patient's full report history
                        setPatient(currentPatient);
                    }
                }

                if (drugsRes.ok) {
                    setPrescriptions(drugsData.prescriptions || []);
                }
            } catch (error) {
                console.error('Failed to fetch patient details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handlePrescribe = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/prescriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: id,
                    medication,
                    dosage,
                    instructions
                }),
            });

            if (response.ok) {
                const newP = await response.json();
                setPrescriptions(prev => [{
                    medication,
                    dosage,
                    instructions,
                    created_at: new Date().toISOString(),
                    id: Math.random().toString() // Temporary ID for UI
                }, ...prev]);
                setShowPrescriptionModal(false);
                setMedication('');
                setDosage('');
                setInstructions('');
            }
        } catch (error) {
            console.error('Failed to add prescription:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">Accessing patient records...</p>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h3 className="text-2xl font-bold">Patient Not Found</h3>
                <p className="text-muted-foreground mb-8">You might not have permission to view this patient's records.</p>
                <Link href="/doctor/patients">
                    <Button variant="outline">Back to Patient List</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-6">
                    <Link href="/doctor/patients">
                        <Button variant="outline" className="w-12 h-12 p-0 border-2 rounded-xl hover:bg-primary/5">
                            <ArrowLeft className="w-6 h-6 text-primary" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-4xl font-black text-foreground tracking-tight">{patient.name}</h2>
                        <p className="text-muted-foreground font-bold italic">{patient.email} • {patient.age || 'N/A'} yrs</p>
                    </div>
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                    <Button
                        onClick={() => setShowPrescriptionModal(true)}
                        className="flex-1 lg:flex-none h-14 px-8 bg-linear-to-r from-primary to-accent font-black text-lg rounded-2xl shadow-xl hover:-translate-y-1 transition-all gap-2"
                    >
                        <Plus className="w-6 h-6" />
                        Add Prescription
                    </Button>
                    <Button variant="outline" className="flex-1 lg:flex-none h-14 px-8 border-2 font-black text-lg rounded-2xl">
                        Schedule Call
                    </Button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Metrics Cards */}
                {[
                    { label: 'Health Status', value: patient.status, icon: Heart, trend: 'stable', color: patient.status === 'Healthy' ? 'text-emerald-500' : 'text-orange-500' },
                    { label: 'Last Update', value: patient.lastReport, icon: Activity, trend: 'recent', color: 'text-primary' },
                    { label: 'Total Reports', value: '4', icon: FileText, trend: 'consistent', color: 'text-primary' }
                ].map((m, idx) => (
                    <Card key={idx} className="p-8 border-none bg-card/50 backdrop-blur rounded-[40px] shadow-lg group hover:bg-white transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <m.icon className={cn("w-7 h-7", m.color)} />
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/50">{m.trend}</span>
                        </div>
                        <p className="text-muted-foreground font-bold italic mb-1 uppercase tracking-widest text-xs">{m.label}</p>
                        <p className={cn("text-3xl font-black tracking-tight", m.color)}>{m.value}</p>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Prescriptions List */}
                <Card className="lg:col-span-2 p-10 border-border/50 bg-card/50 backdrop-blur rounded-[40px] shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                                <ClipboardList className="w-6 h-6 text-accent" />
                            </div>
                            <h3 className="text-2xl font-black text-foreground">Active Prescriptions</h3>
                        </div>
                        <span className="bg-accent/10 text-accent px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                            {prescriptions.length} Active
                        </span>
                    </div>

                    <div className="space-y-4">
                        {prescriptions.length > 0 ? (
                            prescriptions.map((p, idx) => (
                                <div key={idx} className="p-6 bg-white rounded-3xl border border-border/50 hover:shadow-md transition-all flex flex-col md:flex-row items-center justify-between gap-6 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                                            <Pill className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="font-black text-xl text-foreground">{p.medication}</p>
                                            <p className="text-sm font-bold text-accent uppercase tracking-widest">{p.dosage}</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 px-6 border-l border-border/50">
                                        <p className="text-sm font-medium text-muted-foreground italic leading-relaxed line-clamp-2">
                                            {p.instructions || 'Standard dosage instructions.'}
                                        </p>
                                    </div>
                                    <div className="text-right whitespace-nowrap">
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Date</p>
                                        <p className="font-bold text-foreground bg-secondary/30 px-3 py-1 rounded-lg">
                                            {new Date(p.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-secondary/10 rounded-[32px] border-2 border-dashed border-border">
                                <Pill className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                <p className="text-muted-foreground font-bold italic">No prescriptions found for this patient.</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Patient Overview / Recent Labs Side Card */}
                <Card className="p-10 border-border/50 bg-card/50 backdrop-blur rounded-[40px] shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <TableIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground">Recent Activity</h3>
                    </div>

                    <div className="mb-8">
                        <SmartwatchVitalsCard showControls={false} />
                    </div>

                    <div className="space-y-6">
                        {[
                            { action: 'Lab Report Uploaded', time: 'Feb 24, 2026', desc: 'Blood Sugar (110 mg/dL)', status: 'Normal' },
                            { action: 'Prescription Added', time: 'Feb 22, 2026', desc: 'Metformin (500mg)', status: 'New' },
                            { action: 'Profile Created', time: 'Feb 15, 2026', desc: 'Account verified', status: 'Done' }
                        ].map((act, i) => (
                            <div key={i} className="relative pl-8 border-l-2 border-border/50 pb-6 last:pb-0">
                                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full bg-white border-4 border-primary shadow-sm" />
                                <div className="space-y-1">
                                    <p className="font-black text-foreground">{act.action}</p>
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest">{act.time}</p>
                                    <p className="text-sm text-muted-foreground italic">{act.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-8 h-12 text-primary font-bold hover:bg-primary/5 rounded-2xl">
                        View Full History
                    </Button>
                </Card>
            </div>

            {/* Prescription Modal */}
            {showPrescriptionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/40 animate-in fade-in duration-300">
                    <Card className="w-full max-w-lg p-10 rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.2)] border-none relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-primary to-accent" />
                        <button onClick={() => setShowPrescriptionModal(false)} className="absolute top-6 right-6 p-2 hover:bg-secondary rounded-full transition-colors">
                            <Plus className="w-6 h-6 rotate-45 text-muted-foreground" />
                        </button>

                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                                <Plus className="w-8 h-8" />
                            </div>
                            <h3 className="text-3xl font-black text-foreground tracking-tight">New Prescription</h3>
                        </div>

                        <form onSubmit={handlePrescribe} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground px-2">Medication Name</label>
                                <Input
                                    placeholder="e.g. Metformin"
                                    className="h-14 rounded-2xl border-border/50 bg-secondary/20 text-lg font-bold"
                                    value={medication}
                                    onChange={(e) => setMedication(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground px-2">Dosage</label>
                                <Input
                                    placeholder="e.g. 500mg, twice daily"
                                    className="h-14 rounded-2xl border-border/50 bg-secondary/20 text-lg font-bold"
                                    value={dosage}
                                    onChange={(e) => setDosage(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black uppercase tracking-widest text-muted-foreground px-2">Special Instructions</label>
                                <textarea
                                    placeholder="Take after meals..."
                                    className="w-full p-4 rounded-2xl border border-border/50 bg-secondary/20 text-lg font-medium min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all italic"
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-16 bg-linear-to-r from-primary to-accent font-black text-xl rounded-2xl shadow-xl hover:-translate-y-1 transition-all gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <ClipboardList className="w-6 h-6" />}
                                Issue Prescription
                            </Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
