'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Users, Search, Loader2, Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function PatientDoctorsPage() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [requestingId, setRequestingId] = useState<string | null>(null);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await fetch('/api/patient/doctors');
                const data = await response.json();
                if (response.ok) {
                    setDoctors(data.doctors || []);
                }
            } catch (error) {
                console.error('Failed to fetch doctors:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDoctors();
    }, []);

    const handleRequest = async (doctorId: string) => {
        setRequestingId(doctorId);
        try {
            const response = await fetch('/api/patient/doctors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doctorId }),
            });

            if (response.ok) {
                setDoctors(doctors.map(d =>
                    d.id === doctorId ? { ...d, requestStatus: 'pending' } : d
                ));
            }
        } catch (error) {
            console.error('Failed to send request:', error);
        } finally {
            setRequestingId(null);
        }
    };

    const filteredDoctors = doctors.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.email.toLowerCase().includes(search.toLowerCase()) ||
        (d.speciality && d.speciality.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">Find a Doctor</h2>
                <p className="text-muted-foreground font-medium italic">Request a healthcare professional to manage your health reports and prescriptions</p>
            </div>

            <div className="flex gap-4 max-w-2xl">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or specialization..."
                        className="pl-12 h-14 bg-card border-border/50 shadow-sm text-lg font-medium rounded-2xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    [1, 2, 3].map(i => (
                        <Card key={i} className="p-8 h-64 animate-pulse bg-secondary/10 rounded-[32px] border-none" />
                    ))
                ) : filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                        <Card key={doctor.id} className="p-8 border-border/50 bg-card/50 backdrop-blur hover:shadow-2xl transition-all rounded-[32px] group flex flex-col justify-between overflow-hidden relative">
                            <div className={`absolute top-0 right-0 p-4 transition-transform group-hover:scale-110 ${doctor.requestStatus === 'accepted' ? 'text-emerald-500' : 'text-primary/20'
                                }`}>
                                <CheckCircle2 className="w-8 h-8" />
                            </div>

                            <div className="space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                    <Users className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-foreground">{doctor.name}</h3>
                                    <p className="text-sm font-bold text-muted-foreground flex items-center gap-2 pt-1 uppercase tracking-widest">
                                        <Mail className="w-4 h-4 text-primary" />
                                        {doctor.email}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-black text-primary/50 uppercase tracking-tighter">Specialization</p>
                                    <p className="text-sm font-bold text-foreground/80 italic">{doctor.speciality || 'General Practice'}</p>
                                </div>
                            </div>

                            <div className="pt-8">
                                {doctor.requestStatus === 'accepted' ? (
                                    <div className="flex items-center gap-2 text-emerald-500 font-black uppercase text-sm bg-emerald-500/10 p-4 rounded-xl justify-center">
                                        <CheckCircle2 className="w-5 h-5" />
                                        Connected Specialist
                                    </div>
                                ) : doctor.requestStatus === 'pending' ? (
                                    <div className="flex items-center gap-2 text-primary/60 font-black uppercase text-sm bg-primary/5 p-4 rounded-xl justify-center animate-pulse">
                                        Request Pending
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => handleRequest(doctor.id)}
                                        disabled={requestingId === doctor.id}
                                        className="w-full h-12 bg-linear-to-r from-primary to-accent font-black rounded-xl shadow-lg hover:-translate-y-1 transition-all gap-2"
                                    >
                                        {requestingId === doctor.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Request Connection
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))
                ) : (
                    <Card className="col-span-full p-20 text-center border-dashed border-2 bg-secondary/10 rounded-[40px]">
                        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-foreground mb-2">No Doctors Available</h3>
                        <p className="text-muted-foreground text-lg italic">We couldn't find any healthcare professionals matching your search.</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
