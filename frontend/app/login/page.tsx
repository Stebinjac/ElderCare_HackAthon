'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Heart, ArrowRight, Github } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                if (data.user.role === 'doctor') {
                    router.push('/doctor/dashboard');
                } else {
                    router.push('/dashboard');
                }
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
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl -z-10 animate-pulse" />

            <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
                {/* Header */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-linear-to-br from-primary to-accent mb-6 shadow-2xl hover:scale-110 transition-transform">
                        <Heart className="w-10 h-10 text-white" />
                    </Link>
                    <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-muted-foreground text-lg italic">Continue your health journey</p>
                </div>

                {/* Login Card */}
                <Card className="p-8 shadow-2xl border-border/50 bg-card/80 backdrop-blur-xl">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-bold border border-destructive/20 animate-in shake-in-1">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-bold text-foreground/80 uppercase tracking-widest px-1">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-14 text-lg border-border/50 bg-background/50 focus:bg-background transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label htmlFor="password" className="block text-sm font-bold text-foreground/80 uppercase tracking-widest">
                                    Password
                                </label>
                                <Link href="#" className="text-sm font-semibold text-primary hover:underline">Forgot?</Link>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-14 text-lg border-border/50 bg-background/50 focus:bg-background transition-all"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 text-xl font-bold bg-linear-to-r from-primary to-accent hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all flex items-center justify-center gap-2 group"
                        >
                            {isLoading ? 'Verifying...' : 'Sign In'}
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
