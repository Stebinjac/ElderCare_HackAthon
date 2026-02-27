'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Heart, ArrowRight, User, Mail, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'patient' | 'doctor'>('patient');
    const [speciality, setSpeciality] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const SPECIALITIES = [
        'General Practice',
        'Cardiology',
        'Geriatrics',
        'Neurology',
        'Pediatrics',
        'Orthopedics',
        'Psychiatry',
        'Internal Medicine',
    ];

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role, speciality: role === 'doctor' ? speciality : null }),
            });

            const data = await response.json();

            if (response.ok) {
                router.push('/login');
            } else {
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-background via-secondary/30 to-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl -z-10" />

            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-linear-to-br from-primary to-accent mb-6 shadow-2xl hover:scale-110 transition-transform">
                        <Heart className="w-10 h-10 text-white" />
                    </Link>
                    <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">Join ElderCare</h1>
                    <p className="text-muted-foreground text-lg italic">Start managing your health today</p>
                </div>

                <Card className="p-8 shadow-2xl border-border/50 bg-card/80 backdrop-blur-xl">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-bold border border-destructive/20 animate-in shake-in-1">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSignup} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="block text-sm font-bold text-foreground/80 uppercase tracking-widest px-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Jane Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-14 pl-12 text-lg border-border/50 bg-background/50 focus:bg-background transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-foreground/80 uppercase tracking-widest px-1">
                                I am a...
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('patient')}
                                    className={`h-14 rounded-2xl border font-bold transition-all ${role === 'patient'
                                        ? 'bg-primary text-white border-primary shadow-lg scale-[1.02]'
                                        : 'bg-background/50 border-border/50 text-muted-foreground hover:bg-background'
                                        }`}
                                >
                                    Patient
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('doctor')}
                                    className={`h-14 rounded-2xl border font-bold transition-all ${role === 'doctor'
                                        ? 'bg-primary text-white border-primary shadow-lg scale-[1.02]'
                                        : 'bg-background/50 border-border/50 text-muted-foreground hover:bg-background'
                                        }`}
                                >
                                    Doctor
                                </button>
                            </div>
                        </div>

                        {role === 'doctor' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label htmlFor="speciality" className="block text-sm font-bold text-foreground/80 uppercase tracking-widest px-1">
                                    Speciality
                                </label>
                                <select
                                    id="speciality"
                                    value={speciality}
                                    onChange={(e) => setSpeciality(e.target.value)}
                                    className="w-full h-14 px-4 text-lg border-border/50 bg-background/50 focus:bg-background rounded-xl transition-all outline-none"
                                    required={role === 'doctor'}
                                >
                                    <option value="" disabled>Select your speciality</option>
                                    {SPECIALITIES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-bold text-foreground/80 uppercase tracking-widest px-1">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-14 pl-12 text-lg border-border/50 bg-background/50 focus:bg-background transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-bold text-foreground/80 uppercase tracking-widest px-1">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-14 pl-12 text-lg border-border/50 bg-background/50 focus:bg-background transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 text-xl font-bold bg-linear-to-r from-primary to-accent hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? 'Creating...' : 'Create Account'}
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-muted-foreground font-medium">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
                    </p>
                </Card>
            </div>
        </div>
    );
}
