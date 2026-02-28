'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, User, CheckCircle2, XCircle, Loader2, AlertCircle, MapPin, ChevronRight, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PreVisitReport from '@/components/PreVisitReport';

export default function DoctorAppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted'>('all');
    const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());

    const fetchAppointments = async () => {
        try {
            const response = await fetch('/api/appointments');
            const data = await response.json();
            if (response.ok) {
                setAppointments(data.appointments || []);
            }
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const handleStatusUpdate = async (appointmentId: string, status: 'accepted' | 'rejected') => {
        try {
            const response = await fetch('/api/appointments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentId, status }),
            });

            if (response.ok) {
                fetchAppointments();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const filteredAppointments = appointments.filter(appt => {
        if (filter === 'all') return true;
        return appt.status === filter;
    });

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'accepted': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
            default: return 'bg-secondary text-muted-foreground';
        }
    };

    const toggleReport = (id: string) => {
        setExpandedReports(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-black text-foreground tracking-tighter">Appointments</h2>
                    <p className="text-muted-foreground font-medium italic">Manage your patient consultations and schedule</p>
                </div>

                <div className="flex bg-secondary/20 p-1.5 rounded-2xl border border-border/50 backdrop-blur-md">
                    {(['all', 'pending', 'accepted'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all uppercase tracking-widest ${filter === f
                                ? 'bg-white text-primary shadow-lg scale-105'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-6">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    </div>
                ) : filteredAppointments.length > 0 ? (
                    filteredAppointments.map((appt) => (
                        <Card
                            key={appt.id}
                            className="p-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 hover:shadow-2xl transition-all border-border/50 bg-card/50 backdrop-blur rounded-[40px] group relative overflow-hidden"
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-2 transition-all ${appt.status === 'accepted' ? 'bg-emerald-500' :
                                appt.status === 'rejected' ? 'bg-destructive' : 'bg-orange-500'
                                }`} />

                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 flex-1">
                                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl group-hover:scale-110 transition-transform border border-primary/20">
                                    {appt.patientName.split(' ').map((n: string) => n[0]).join('')}
                                </div>

                                <div className="space-y-2 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-2xl font-black text-foreground tracking-tight">{appt.patientName}</h3>
                                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(appt.status)}`}>
                                            {appt.status}
                                        </span>
                                        {appt.pre_visit_report && (
                                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1">
                                                <FileText className="w-3 h-3" />
                                                Report Ready
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-lg font-bold text-muted-foreground italic">{appt.type}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-border/50">
                                            <Calendar className="w-5 h-5 text-primary" />
                                            <span className="font-bold">{new Date(appt.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-border/50">
                                            <Clock className="w-5 h-5 text-primary" />
                                            <span className="font-bold">{appt.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {appt.status === 'pending' ? (
                                <div className="flex gap-3 min-w-[280px]">
                                    <Button
                                        onClick={() => handleStatusUpdate(appt.id, 'accepted')}
                                        className="flex-1 h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Accept
                                    </Button>
                                    <Button
                                        onClick={() => handleStatusUpdate(appt.id, 'rejected')}
                                        variant="outline"
                                        className="flex-1 h-16 border-destructive/30 text-destructive hover:bg-destructive/5 font-black rounded-2xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-5 h-5" />
                                        Decline
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-3 min-w-[280px]">
                                    <Link href={`/doctor/patients/${appt.patient_id}`} className="flex-1">
                                        <Button className="w-full h-16 bg-primary text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2">
                                            View Profile
                                            <ChevronRight className="w-5 h-5" />
                                        </Button>
                                    </Link>
                                    <Button variant="outline" className="h-16 px-6 border-border/50 font-black rounded-2xl">
                                        History
                                    </Button>
                                </div>
                            )}

                            {/* Pre-Visit Report Section */}
                            {appt.pre_visit_report && (
                                <div className="w-full mt-4 pt-4 border-t border-border/30">
                                    <button
                                        onClick={() => toggleReport(appt.id)}
                                        className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors mb-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        {expandedReports.has(appt.id) ? 'Hide' : 'View'} Pre-Visit Report
                                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedReports.has(appt.id) ? 'rotate-180' : ''}`} />
                                    </button>
                                    {expandedReports.has(appt.id) && (
                                        <PreVisitReport report={appt.pre_visit_report} compact={false} />
                                    )}
                                </div>
                            )}
                        </Card>
                    ))
                ) : (
                    <Card className="p-24 text-center border-dashed border-4 border-secondary/50 bg-secondary/5 rounded-[60px] flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center mb-8">
                            <Calendar className="w-12 h-12 text-muted-foreground" />
                        </div>
                        <h3 className="text-3xl font-black text-foreground mb-3">No Appointments Found</h3>
                        <p className="text-muted-foreground text-xl font-medium max-w-sm italic">
                            Your schedule is currently clear. New requests will appear here once patients book them.
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
}
