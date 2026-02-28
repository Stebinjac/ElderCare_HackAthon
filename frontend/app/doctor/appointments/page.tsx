'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, User, CheckCircle2, XCircle, Loader2, AlertCircle, MapPin, ChevronRight, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import PreVisitReport from '@/components/PreVisitReport';
import { cn } from '@/lib/utils';

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-10 bg-primary rounded-full" />
                        <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase">Appointments</h2>
                    </div>
                    <p className="text-lg md:text-xl text-muted-foreground font-medium italic pl-4 opacity-70">
                        Managing <span className="text-primary font-bold not-italic">{appointments.length}</span> patient consultations in your queue
                    </p>
                </div>

                <div className="flex bg-card/40 backdrop-blur-xl p-1.5 rounded-[24px] border border-border/50 shadow-sm self-stretch md:self-start xl:self-auto">
                    {(['all', 'pending', 'accepted'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "flex-1 md:flex-none px-8 py-3 rounded-[18px] font-black text-xs transition-all uppercase tracking-[0.2em]",
                                filter === f
                                    ? "bg-primary text-primary-foreground shadow-xl scale-105"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                            )}
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
                            className="p-6 md:p-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8 hover:shadow-2xl transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-xl rounded-[40px] group relative overflow-hidden"
                        >
                            {/* Status Indicator Sidebar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-2.5 transition-all duration-500 ${appt.status === 'accepted' ? 'bg-linear-to-b from-emerald-400 to-emerald-600' :
                                appt.status === 'rejected' ? 'bg-linear-to-b from-destructive to-red-600' : 'bg-linear-to-b from-orange-400 to-orange-600'
                                }`} />

                            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 flex-1">
                                {/* Patient Avatar Wrapper */}
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-[28px] bg-linear-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center text-primary font-black text-2xl group-hover:scale-105 transition-transform duration-500 border border-primary/20 shadow-inner">
                                        {appt.patientName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                    </div>
                                    <div className={cn(
                                        "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-card flex items-center justify-center shadow-lg",
                                        appt.status === 'accepted' ? 'bg-emerald-500' : appt.status === 'rejected' ? 'bg-red-500' : 'bg-orange-500'
                                    )}>
                                        {appt.status === 'accepted' ? <CheckCircle2 className="w-3 h-3 text-white" /> : appt.status === 'rejected' ? <XCircle className="w-3 h-3 text-white" /> : <Clock className="w-3 h-3 text-white" />}
                                    </div>
                                </div>

                                <div className="space-y-3 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{appt.patientName}</h3>
                                        <div className={cn(
                                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border transition-all shadow-sm",
                                            getStatusStyles(appt.status)
                                        )}>
                                            {appt.status}
                                        </div>
                                        {appt.pre_visit_report && (
                                            <div className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1.5 animate-pulse shadow-sm">
                                                <FileText className="w-3.5 h-3.5" />
                                                Report Ready
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <p className="px-3 py-1 bg-secondary/50 rounded-lg text-sm font-bold text-muted-foreground italic border border-border/30">
                                            {appt.type}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 pt-4">
                                        <div className="flex items-center gap-3 bg-white/60 dark:bg-white/5 px-4 py-3 rounded-2xl border border-border/40 shadow-sm group/date hover:border-primary/30 transition-colors">
                                            <div className="p-2 bg-primary/10 rounded-xl group-hover/date:bg-primary/20 transition-colors">
                                                <Calendar className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Date</span>
                                                <span className="font-bold text-sm tracking-tight">{new Date(appt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/60 dark:bg-white/5 px-4 py-3 rounded-2xl border border-border/40 shadow-sm group/time hover:border-primary/30 transition-colors">
                                            <div className="p-2 bg-primary/10 rounded-xl group-hover/time:bg-primary/20 transition-colors">
                                                <Clock className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-black text-muted-foreground tracking-tighter">Time</span>
                                                <span className="font-bold text-sm tracking-tight">{appt.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row lg:flex-col xl:flex-row gap-3 min-w-[280px]">
                                {appt.status === 'pending' ? (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(appt.id, 'accepted')}
                                            className="flex-1 h-14 bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2.5 px-6"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span>ACCEPT</span>
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(appt.id, 'rejected')}
                                            className="flex-1 h-14 border-2 border-destructive/20 text-destructive hover:bg-destructive shadow-sm hover:text-white font-black rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2.5 px-6"
                                        >
                                            <XCircle className="w-5 h-5" />
                                            <span>DECLINE</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link href={`/doctor/patients/${appt.patient_id}`} className="flex-1">
                                            <button className="w-full h-14 bg-linear-to-r from-primary to-accent hover:shadow-xl text-white font-black rounded-2xl shadow-lg shadow-primary/10 active:scale-95 transition-all flex items-center justify-center gap-2.5 px-6">
                                                <span>VIEW PROFILE</span>
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </Link>
                                        <button className="h-14 px-6 border border-border/50 bg-secondary/20 hover:bg-secondary/40 font-black rounded-2xl active:scale-95 transition-all uppercase tracking-widest text-xs">
                                            HISTORY
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Pre-Visit Report Section */}
                            {appt.pre_visit_report && (
                                <div className="w-full mt-6 pt-6 border-t border-border/20">
                                    <button
                                        onClick={() => toggleReport(appt.id)}
                                        className="flex items-center gap-3 px-5 py-2.5 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-2xl text-sm font-black text-emerald-600 transition-all border border-emerald-500/10 group/view"
                                    >
                                        <div className="p-1.5 bg-emerald-500/10 rounded-lg group-hover/view:scale-110 transition-transform">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <span className="uppercase tracking-widest">{expandedReports.has(appt.id) ? 'Hide' : 'View'} Pre-Visit Briefing</span>
                                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-500", expandedReports.has(appt.id) ? 'rotate-180' : '')} />
                                    </button>
                                    {expandedReports.has(appt.id) && (
                                        <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <PreVisitReport report={appt.pre_visit_report} compact={false} />
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))
                ) : (
                    <Card className="p-20 text-center border-dashed border-2 border-border/50 bg-card/30 backdrop-blur rounded-[60px] flex flex-col items-center group overflow-hidden relative">
                        <div className="absolute inset-0 bg-linear-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="w-28 h-28 rounded-[38px] bg-linear-to-br from-secondary/50 via-secondary/20 to-transparent flex items-center justify-center mb-8 shadow-xl group-hover:rotate-12 transition-transform duration-700">
                            <Calendar className="w-14 h-14 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-3xl font-black text-foreground mb-3 tracking-tight">Schedule is Clear</h3>
                        <p className="text-muted-foreground text-xl font-medium max-w-sm italic opacity-80">
                            No upcoming consultations. New requests will appear here once booked.
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
}
