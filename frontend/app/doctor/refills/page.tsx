'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ClipboardList, Loader2, Pill, AlertCircle, Info } from 'lucide-react';
import RefillApprovalCard from '@/components/RefillApprovalCard';
import { toast } from 'sonner';

export default function DoctorRefillsPage() {
    const [pendingRefills, setPendingRefills] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('/api/auth/me');
                const data = await response.json();
                if (response.ok) {
                    setUserId(data.user.id);
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };

        const fetchData = async () => {
            setIsLoading(true);
            await fetchUserData();
            setIsLoading(false);
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (userId) {
            fetchPendingRefills();
        }
    }, [userId]);

    const fetchPendingRefills = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/refill/pending/${userId}`);
            const data = await response.json();
            setPendingRefills(data || []);
        } catch (error) {
            console.error('Failed to fetch pending refills:', error);
        }
    };

    const handleApproveRefill = async (refillId: string) => {
        try {
            const response = await fetch('http://localhost:8000/api/refill/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    refill_id: refillId,
                    user_id: userId,
                    role: 'doctor'
                }),
            });

            if (response.ok) {
                toast.success('Refill approved by you!');
                fetchPendingRefills();
            } else {
                toast.error('Failed to approve refill');
            }
        } catch (error) {
            console.error('Approval error:', error);
            toast.error('Connection error');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-4xl font-black text-foreground tracking-tight">Refill Management</h2>
                <p className="text-muted-foreground font-medium italic">Approve autonomous medication refills with patient health context</p>
            </div>

            <div className="grid gap-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-muted-foreground font-black uppercase tracking-widest text-sm italic">Syncing with medical agent...</p>
                    </div>
                ) : pendingRefills.length > 0 ? (
                    <div className="grid gap-6">
                        <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 flex items-center gap-6">
                            <Info className="w-10 h-10 text-primary shrink-0" />
                            <p className="text-sm font-bold text-foreground/70 italic">
                                The autonomous RefillAgent has identified these patients' medications are running low.
                                Please review their health context and approve the restock. Final restock occurs after patient confirmation.
                            </p>
                        </div>
                        {pendingRefills.map((refill) => (
                            <RefillApprovalCard
                                key={refill.id}
                                refill={refill}
                                role="doctor"
                                onApprove={handleApproveRefill}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="p-20 text-center border-dashed border-2 bg-secondary/10 rounded-[40px]">
                        <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-foreground mb-2 tracking-tight">All Caught Up!</h3>
                        <p className="text-muted-foreground text-lg max-w-sm mx-auto italic font-medium">
                            No pending refill requests require your attention at the moment.
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
}
