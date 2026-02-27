'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardList, Check, X, User, Mail, Calendar, Loader2 } from 'lucide-react';

export default function DoctorRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await fetch('/api/doctor/requests');
                const data = await response.json();
                if (response.ok) {
                    setRequests(data.requests.map((r: any) => ({
                        id: r.id,
                        name: r.patient.name,
                        email: r.patient.email,
                        date: new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    })));
                }
            } catch (error) {
                console.error('Failed to fetch requests:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRequests();
    }, []);

    const handleAction = async (id: string, action: 'accepted' | 'rejected') => {
        setActionLoading(id);
        try {
            const response = await fetch('/api/doctor/requests', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: id, status: action }),
            });

            if (response.ok) {
                setRequests(requests.filter(r => r.id !== id));
            }
        } catch (error) {
            console.error(`Failed to ${action} request:`, error);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">Pending Patient Requests</h2>
                <p className="text-muted-foreground font-medium italic">Accept requests to manage their health profile and prescriptions</p>
            </div>

            <div className="grid gap-6">
                {isLoading ? (
                    [1, 2, 3].map(i => (
                        <Card key={i} className="p-8 h-32 flex items-center justify-center animate-pulse bg-secondary/10 rounded-[32px] border-none" />
                    ))
                ) : requests.length > 0 ? (
                    requests.map((request) => (
                        <Card key={request.id} className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-border/50 bg-card/50 backdrop-blur hover:shadow-2xl transition-all rounded-[40px] group">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                                    <User className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-foreground">{request.name}</h3>
                                    <div className="flex flex-wrap gap-4 text-sm font-bold text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-primary" />
                                            {request.email}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-primary" />
                                            Requested on {request.date}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <Button
                                    onClick={() => handleAction(request.id, 'accepted')}
                                    disabled={actionLoading === request.id}
                                    className="flex-1 md:flex-none h-14 px-8 bg-emerald-500 hover:bg-emerald-600 font-black text-lg rounded-2xl shadow-xl hover:shadow-emerald-500/20 transition-all gap-2"
                                >
                                    {actionLoading === request.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-6 h-6" />}
                                    Accept
                                </Button>
                                <Button
                                    onClick={() => handleAction(request.id, 'rejected')}
                                    disabled={actionLoading === request.id}
                                    variant="outline"
                                    className="flex-1 md:flex-none h-14 px-8 border-2 font-black text-lg text-destructive hover:bg-destructive/10 rounded-2xl transition-all gap-2"
                                >
                                    <X className="w-6 h-6" />
                                    Decline
                                </Button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <Card className="p-20 text-center border-dashed border-2 bg-secondary/10 rounded-[40px]">
                        <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-foreground mb-2">No Pending Requests</h3>
                        <p className="text-muted-foreground text-lg max-w-md mx-auto italic font-medium">
                            Check back later for new patient consultation requests.
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
}
