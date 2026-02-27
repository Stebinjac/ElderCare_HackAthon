'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ClipboardList, Loader2, Pill, Calendar, User, Info, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PatientPrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPrescriptions = async () => {
            try {
                const response = await fetch('/api/prescriptions');
                const data = await response.json();
                if (response.ok) {
                    setPrescriptions(data.prescriptions || []);
                }
            } catch (error) {
                console.error('Failed to fetch prescriptions:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrescriptions();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">Prescriptions</h2>
                <p className="text-muted-foreground font-medium italic">Medicines and dosages prescribed by your doctor</p>
            </div>

            <div className="grid gap-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-muted-foreground font-black uppercase tracking-widest text-sm italic">Loading your prescriptions...</p>
                    </div>
                ) : prescriptions.length > 0 ? (
                    prescriptions.map((p) => (
                        <Card key={p.id} className="p-8 border-border/50 bg-card/50 backdrop-blur hover:shadow-2xl transition-all rounded-[40px] group relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-3 bg-accent transition-all group-hover:w-4" />
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-20 h-20 rounded-3xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 group-hover:scale-110 transition-transform">
                                        <Pill className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black text-foreground tracking-tight">{p.medication}</h3>
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-accent/10 text-accent text-xs font-black uppercase tracking-widest rounded-lg">{p.dosage}</span>
                                            <span className="text-sm font-bold text-muted-foreground italic flex items-center gap-1.5">
                                                <Calendar className="w-4 h-4" />
                                                Prescribed on {new Date(p.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 max-w-md">
                                    <div className="bg-secondary/20 p-6 rounded-[24px] border border-border/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Info className="w-4 h-4 text-primary" />
                                            <p className="text-xs font-black uppercase tracking-widest text-primary/70">Instructions</p>
                                        </div>
                                        <p className="text-foreground font-medium leading-relaxed italic line-clamp-2 group-hover:line-clamp-none transition-all duration-500">
                                            {p.instructions || 'No specific instructions provided.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-right">
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-tighter mb-1">Doctor</p>
                                        <div className="flex items-center gap-2 text-foreground font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-border/50">
                                            <User className="w-4 h-4 text-primary" />
                                            {p.doctor_name}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <Card className="p-20 text-center border-dashed border-2 bg-secondary/10 rounded-[40px]">
                        <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-foreground mb-2">No Active Prescriptions</h3>
                        <p className="text-muted-foreground text-lg max-w-sm mx-auto italic font-medium">
                            Your doctor hasn't prescribed any medications yet. They will appear here once added.
                        </p>
                    </Card>
                )}
            </div>

            <div className="p-8 bg-primary/5 rounded-[32px] border border-primary/10 flex items-center gap-6">
                <AlertCircle className="w-10 h-10 text-primary shrink-0" />
                <p className="text-sm font-bold text-foreground/70 italic">
                    Always consult your doctor before making changes to your medication schedule. The instructions provided here are for informational purposes based on your latest records.
                </p>
            </div>
        </div>
    );
}
