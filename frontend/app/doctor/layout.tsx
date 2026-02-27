'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Users, FileText, Settings, LogOut, Menu, X, Activity, ClipboardList, Calendar } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DoctorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user, setUser] = useState<{ name: string } | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/auth/me');
                const data = await response.json();
                if (response.ok) {
                    setUser(data.user);
                }
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
        };
        fetchUser();
    }, []);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout failed:', error);
            window.location.href = '/login';
        }
    };

    const navItems = [
        { icon: Activity, label: 'Doctor Hub', href: '/doctor/dashboard' },
        { icon: Users, label: 'My Patients', href: '/doctor/patients' },
        { icon: Calendar, label: 'Appointments', href: '/doctor/appointments' },
        { icon: Settings, label: 'Settings', href: '/doctor/settings' },
    ];

    const getPageTitle = () => {
        const activeItem = navItems.find(item => pathname.startsWith(item.href));
        return activeItem ? activeItem.label : 'Doctor Dashboard';
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 z-40 ${!isSidebarOpen && '-translate-x-full'
                    } md:translate-x-0`}
            >
                {/* Logo */}
                <div className="p-6 border-b border-sidebar-border">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                            <Heart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-sidebar-foreground">ElderCare</h2>
                            <p className="text-xs text-muted-foreground font-bold italic">Doctor Portal</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium transition-all duration-200 ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-md'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout */}
                <div className="absolute bottom-6 left-4 right-4">
                    <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 h-11 text-base font-medium border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/50 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="md:ml-64 transition-all duration-300">
                {/* Header */}
                <header className="bg-card border-b border-border sticky top-0 z-30 backdrop-blur-sm shadow-sm">
                    <div className="flex items-center justify-between px-6 py-4 md:py-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="md:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
                            >
                                {isSidebarOpen ? (
                                    <X className="w-6 h-6" />
                                ) : (
                                    <Menu className="w-6 h-6" />
                                )}
                            </button>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                {getPageTitle()}
                            </h1>
                        </div>

                        {/* User Avatar */}
                        <div className="flex items-center gap-4">
                            <div className="hidden md:block text-right">
                                <p className="font-bold text-sm">
                                    {user ? `Dr. ${user.name}` : 'Loading...'}
                                </p>
                                <p className="text-xs text-muted-foreground uppercase font-black">Chief Specialist</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform border-4 border-background">
                                <span className="text-white font-bold text-lg">
                                    {user ? getInitials(user.name) : '...'}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 md:p-8 max-w-7xl mx-auto">
                    {children}
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 md:hidden z-30 backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
