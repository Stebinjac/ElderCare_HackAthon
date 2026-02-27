'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Users, ClipboardList, CheckCircle2, AlertCircle, Loader2, Search, ArrowRight, User, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DoctorDashboardPage() {
    const [stats, setStats] = useState({
        totalPatients: 0,
        pendingRequests: 0,
        criticalCases: 0,
        checksToday: 0
    });
    const [recentPatients, setRecentPatients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch('/api/doctor/patients');
                const data = await response.json();

                if (response.ok) {
                    const patients = data.patients || [];

                    setStats({
                        totalPatients: patients.length,
                        pendingRequests: 0,
                        criticalCases: patients.filter((p: any) => p.status === 'Critical').length,
                        checksToday: patients.filter((p: any) => p.lastReport && (p.lastReport.includes('Today') || p.lastReport.includes('hour'))).length
                    });
                    setRecentPatients(patients.slice(0, 5));
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Banner */}
            <Card className="p-10 bg-linear-to-br from-primary via-primary/90 to-accent text-white border-none shadow-2xl relative overflow-hidden group rounded-[40px]">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
                <div className="space-y-4 relative">
                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Good Afternoon, Doctor.</h2>
                    <p className="text-xl md:text-2xl opacity-90 max-w-2xl font-medium">
                        Welcome back to your clinical dashboard. Monitoring <span className="font-black underline decoration-4 underline-offset-8 decoration-white/30">{stats.totalPatients} active patients</span> today.
                    </p>
                </div>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Patients', value: stats.totalPatients, icon: Users, color: 'text-primary' },
                    { label: 'Critical Cases', value: stats.criticalCases, icon: AlertCircle, color: 'text-destructive' },
                    { label: 'Reviews Today', value: stats.checksToday, icon: CheckCircle2, color: 'text-emerald-500' },
                ].map((stat, idx) => (
                    <Card key={idx} className="p-8 border-border/50 bg-card/50 backdrop-blur-xl hover:shadow-2xl transition-all group hover:-translate-y-1 rounded-[32px]">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-4 rounded-2xl bg-secondary/50 group-hover:scale-110 transition-transform`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs mb-1">{stat.label}</p>
                        <p className="text-4xl font-black text-foreground">{isLoading ? '...' : stat.value}</p>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Active Patient List */}
                <Card className="p-8 shadow-xl border-border/50 bg-card/50 backdrop-blur rounded-[40px]">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-black text-foreground">Active Patients</h3>
                        <div className="relative w-64 text-left">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input placeholder="Search patients..." className="pl-10 h-11 bg-secondary/30 border-none rounded-xl" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
                        ) : (
                            recentPatients.map((patient) => (
                                <Link key={patient.id} href={`/doctor/patients/${patient.id}`} className="block">
                                    <div className="p-6 bg-secondary/10 rounded-3xl border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-lg transition-all flex items-center justify-between group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl group-hover:scale-110 transition-transform">
                                                {patient.name.split(' ').map((n: string) => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="font-black text-lg text-foreground">{patient.name}</p>
                                                <p className="text-sm text-muted-foreground font-semibold">Last Report: {patient.lastReport}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-6">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${patient.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-500' :
                                                patient.status === 'Critical' ? 'bg-destructive/10 text-destructive' : 'bg-orange-500/10 text-orange-500'
                                                }`}>
                                                {patient.status}
                                            </span>
                                            <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors hover:translate-x-1" />
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                    <Button variant="ghost" className="w-full mt-8 h-12 text-primary font-bold hover:bg-primary/5 rounded-2xl">
                        View All Patients
                    </Button>
                </Card>

                {/* Patient Health Trends Chart Placeholder */}
                <Card className="p-8 shadow-xl border-border/50 bg-card/50 backdrop-blur rounded-[40px] flex flex-col items-center justify-center text-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary/5 -z-10 group" />
                    <div className="w-20 h-20 rounded-3xl bg-primary/20 flex items-center justify-center mb-6">
                        <Activity className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-black mb-2">Health Analytics</h3>
                    <p className="text-muted-foreground font-medium mb-8 max-w-xs">
                        Monitor health trends across your entire patient list with real-time data visualization.
                    </p>
                    <div className="w-full h-64 bg-secondary/30 rounded-[32px] border border-dashed border-primary/20 animate-pulse flex items-center justify-center">
                        <span className="text-sm font-bold text-muted-foreground italic">Chart visualization loading...</span>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function ChevronRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}
