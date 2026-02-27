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

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-3 text-muted-foreground font-semibold">Or continue with</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-12 font-bold flex items-center justify-center gap-2">
                            <Github className="w-5 h-5" /> GitHub
                        </Button>
                        <Button variant="outline" className="h-12 font-bold flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </Button>
                    </div>

                    <p className="mt-8 text-center text-muted-foreground font-medium">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-primary font-bold hover:underline">Create account</Link>
                    </p>
                </Card>
            </div>
        </div>
    );
}
