'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Users, Search, Loader2, ChevronRight, Filter, MessageSquare, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DoctorPatientsPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const response = await fetch('/api/doctor/patients');
                const data = await response.json();
                if (response.ok) {
                    setPatients(data.patients || []);
                }
            } catch (error) {
                console.error('Failed to fetch patients:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPatients();
    }, []);

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-foreground tracking-tight">My Patients</h2>
                    <p className="text-muted-foreground font-medium italic">Manage health overview and prescriptions for your assigned patients</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-12 h-14 bg-card border-border/50 shadow-sm text-lg font-medium rounded-2xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" className="h-14 w-14 p-0 border-2 rounded-2xl">
                        <Filter className="w-6 h-6" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">Loading your patient roster...</p>
                    </div>
                ) : filteredPatients.length > 0 ? (
                    filteredPatients.map((patient) => (
                        <Link key={patient.id} href={`/doctor/patients/${patient.id}`} className="block">
                            <Card className="p-10 border-border/50 bg-card/50 backdrop-blur hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all rounded-[40px] group relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-3 bg-primary group-hover:w-4 transition-all" />
                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
                                    <div className="flex items-center gap-8">
                                        <div className="w-24 h-24 rounded-[32px] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform shadow-inner">
                                            <Users className="w-12 h-12" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-4">
                                                <h3 className="text-3xl font-black text-foreground">{patient.name}</h3>
                                                <span className="px-3 py-1 bg-secondary text-muted-foreground rounded-lg text-sm font-bold">{patient.age} yrs</span>
                                            </div>
                                            <p className="text-lg font-bold text-muted-foreground">{patient.email}</p>
                                            <div className="flex items-center gap-4 pt-2">
                                                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${patient.status === 'Healthy' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    patient.status === 'Critical' ? 'bg-destructive/10 text-destructive' : 'bg-orange-500/10 text-orange-500'
                                                    }`}>
                                                    {patient.status}
                                                </span>
                                                <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5 italic">
                                                    <History className="w-4 h-4" />
                                                    Updated {patient.lastCheck}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                                        <Button className="w-full lg:flex-none h-14 px-8 bg-linear-to-r from-primary to-accent font-black text-lg rounded-2xl shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2">
                                            View Reports
                                            <ChevronRight className="w-6 h-6" />
                                        </Button>
                                        <Button variant="outline" className="w-full lg:w-14 h-14 p-0 border-2 rounded-2xl">
                                            <MessageSquare className="w-6 h-6 text-primary" />
                                        </Button>
                                        <Button variant="outline" className="w-full lg:flex-none h-14 px-8 border-2 font-black text-lg rounded-2xl">
                                            Prescribe
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))
                ) : (
                    <Card className="p-20 text-center border-dashed border-2 bg-secondary/10 rounded-[40px]">
                        <Users className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-foreground mb-4 tracking-tight">No Patients Found</h3>
                        <p className="text-muted-foreground text-lg max-w-md mx-auto italic font-medium">
                            Try adjusting your search query or check your pending requests.
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
}
