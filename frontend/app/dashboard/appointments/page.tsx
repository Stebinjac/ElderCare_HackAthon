"use client"
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, MapPin, Clock, Plus, Loader2, User, ChevronRight, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AppointmentsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [myDoctors, setMyDoctors] = useState<any[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [reason, setReason] = useState('');

    const fetchAppointments = async () => {
        try {
            const response = await fetch('/api/appointments');
            const data = await response.json();
            if (response.ok) {
                setAppointments(data.appointments);
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

    useEffect(() => {
        if (isBookingModalOpen) {
            const fetchMyDoctors = async () => {
                try {
                    const response = await fetch('/api/patient/doctors');
                    const data = await response.json();
                    if (response.ok) {
                        // Filter for only accepted doctors
                        const acceptedDoctors = (data.doctors || []).filter((d: any) => d.requestStatus === 'accepted');
                        setMyDoctors(acceptedDoctors);
                    }
                } catch (error) {
                    console.error('Failed to fetch doctors:', error);
                }
            };
            fetchMyDoctors();
        }
    }, [isBookingModalOpen]);

    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            const fetchSlots = async () => {
                setIsLoadingSlots(true);
                setAvailableSlots([]);
                setSelectedSlot('');
                try {
                    const response = await fetch(`/api/appointments/slots?doctorId=${selectedDoctor.id}&date=${selectedDate}`);
                    const data = await response.json();
                    if (response.ok) {
                        setAvailableSlots(data.slots || []);
                    }
                } catch (error) {
                    console.error('Failed to fetch slots:', error);
                } finally {
                    setIsLoadingSlots(false);
                }
            };
            fetchSlots();
        }
    }, [selectedDoctor, selectedDate]);

    const handleBookAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoctor || !selectedDate || !selectedSlot) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorId: selectedDoctor.id,
                    date: selectedDate,
                    time: selectedSlot,
                    reason,
                }),
            });

            if (response.ok) {
                setIsBookingModalOpen(false);
                fetchAppointments();
                // Reset form
                setSelectedDoctor(null);
                setSelectedDate('');
                setSelectedSlot('');
                setReason('');
            }
        } catch (error) {
            console.error('Failed to book appointment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'accepted': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'rejected': return 'bg-destructive/10 text-destructive border-destructive/20';
            default: return 'bg-secondary text-muted-foreground';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Appointments</h2>
                    <p className="text-muted-foreground">Manage your medical schedule</p>
                </div>
                <Button
                    onClick={() => setIsBookingModalOpen(true)}
                    className="h-12 px-6 text-lg font-bold gap-2 shadow-lg hover:shadow-primary/20 transition-all rounded-xl"
                >
                    <Plus className="w-5 h-5" />
                    Book Appointment
                </Button>
            </div>

            <div className="grid gap-6">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    </div>
                ) : appointments.length > 0 ? (
                    appointments.map((appt, idx) => (
                        <Card
                            key={appt.id}
                            className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-2xl transition-all border-border/50 bg-card/50 backdrop-blur rounded-[32px] group relative overflow-hidden"
                        >
                            <div className={`absolute left-0 top-0 bottom-0 w-2 group-hover:w-3 transition-all ${appt.status === 'accepted' ? 'bg-emerald-500' :
                                appt.status === 'rejected' ? 'bg-destructive' : 'bg-orange-500'
                                }`} />
                            <div className="flex flex-col md:flex-row items-start gap-6 w-full">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-foreground tracking-tight">Dr. {appt.doctorName}</h3>
                                                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{appt.type}</p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusStyles(appt.status)}`}>
                                            {appt.status}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                        <div className="flex items-center gap-3 bg-white/50 p-4 rounded-2xl border border-border/50">
                                            <CalendarIcon className="w-5 h-5 text-primary" />
                                            <span className="font-bold text-lg">{new Date(appt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/50 p-4 rounded-2xl border border-border/50">
                                            <Clock className="w-5 h-5 text-primary" />
                                            <span className="font-bold text-lg">{appt.time}</span>
                                        </div>
                                        <div className="flex items-center gap-3 bg-white/50 p-4 rounded-2xl border border-border/50">
                                            <MapPin className="w-5 h-5 text-primary" />
                                            <span className="font-bold text-lg italic">Clinic Visit</span>
                                        </div>
                                    </div>

                                    {appt.reason && (
                                        <div className="bg-secondary/20 p-4 rounded-2xl border border-border/50 italic text-muted-foreground">
                                            <p className="text-sm font-bold uppercase tracking-tighter text-primary/70 mb-1">Reason for visit</p>
                                            {appt.reason}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                {appt.status === 'rejected' && (
                                    <Button
                                        onClick={() => {
                                            setSelectedDoctor(myDoctors.find(d => d.name === appt.doctorName));
                                            setIsBookingModalOpen(true);
                                        }}
                                        className="flex-1 md:flex-none h-12 px-6 font-bold rounded-xl bg-primary text-primary-foreground"
                                    >
                                        Re-book
                                    </Button>
                                )}
                                <Button variant="outline" className="flex-1 md:flex-none h-12 px-6 font-bold rounded-xl">Details</Button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <Card className="p-20 text-center border-dashed border-2 bg-secondary/10 rounded-[40px]">
                        <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-foreground mb-2">No Upcoming Appointments</h3>
                        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                            You don't have any appointments scheduled at the moment.
                        </p>
                        <Button
                            onClick={() => setIsBookingModalOpen(true)}
                            className="h-14 px-10 text-xl font-bold rounded-2xl"
                        >
                            Schedule a Consultation
                        </Button>
                    </Card>
                )}
            </div>

            {/* Booking Modal */}
            {isBookingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsBookingModalOpen(false)} />
                    <Card className="relative w-full max-w-2xl bg-card border-none shadow-2xl rounded-[40px] overflow-hidden animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-border/50 flex items-center justify-between bg-linear-to-r from-primary/5 to-accent/5">
                            <div>
                                <h3 className="text-3xl font-black text-foreground tracking-tight">Book Consultation</h3>
                                <p className="text-muted-foreground font-medium italic">Schedule a time with your doctor</p>
                            </div>
                            <button onClick={() => setIsBookingModalOpen(false)} className="p-3 hover:bg-secondary rounded-2xl transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleBookAppointment} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                            {/* Doctor Selection */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-primary px-1">Select Doctor</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {myDoctors.length > 0 ? (
                                        myDoctors.map((doc) => (
                                            <div
                                                key={doc.id}
                                                onClick={() => setSelectedDoctor(doc)}
                                                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${selectedDoctor?.id === doc.id
                                                    ? 'border-primary bg-primary/5 shadow-lg scale-102'
                                                    : 'border-border/50 hover:border-primary/30 bg-secondary/10'
                                                    }`}
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-white/50 flex items-center justify-center text-primary font-bold">
                                                    {doc.name.split(' ').map((n: string) => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <p className="font-black text-foreground">Dr. {doc.name}</p>
                                                    <p className="text-xs font-bold text-muted-foreground italic">General Medicine</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-2 p-6 rounded-3xl bg-secondary/10 text-center flex flex-col items-center gap-3">
                                            <AlertCircle className="w-8 h-8 text-muted-foreground" />
                                            <p className="text-muted-foreground font-bold italic">You don't have any registered doctors.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Date Selection */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-primary px-1">Choose Date</label>
                                <Input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="h-14 text-lg font-bold rounded-2xl bg-secondary/10 border-border/50 focus:bg-white transition-all"
                                />
                            </div>

                            {/* Time Slot Selection */}
                            {selectedDoctor && selectedDate && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                    <label className="text-xs font-black uppercase tracking-widest text-primary px-1">Available Time Slots</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {isLoadingSlots ? (
                                            [1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-secondary/10 rounded-xl animate-pulse" />)
                                        ) : availableSlots.length > 0 ? (
                                            availableSlots.map((slot) => (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`h-12 rounded-xl font-bold transition-all border-2 ${selectedSlot === slot
                                                        ? 'bg-primary text-white border-primary shadow-lg'
                                                        : 'bg-white border-border/50 hover:border-primary/30 text-foreground'
                                                        }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="col-span-full text-center text-muted-foreground italic font-bold p-4 bg-secondary/5 rounded-2xl">
                                                No slots available for this date.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Reason */}
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase tracking-widest text-primary px-1">Reason for consultation (Optional)</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Briefly describe your health concern..."
                                    className="w-full p-6 text-lg font-medium rounded-3xl bg-secondary/10 border-border/50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[120px]"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || !selectedDoctor || !selectedDate || !selectedSlot}
                                className="w-full h-16 text-xl font-black rounded-3xl bg-linear-to-r from-primary to-accent shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? <Loader2 className="w-8 h-8 animate-spin" /> : <><CheckCircle2 className="w-6 h-6" /> Confirm Booking</>}
                            </Button>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
