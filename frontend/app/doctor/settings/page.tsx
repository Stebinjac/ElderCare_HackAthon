'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DoctorSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        hospital_name: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/api/user/profile');
                if (res.ok) {
                    const data = await res.json();
                    setProfile({
                        name: data.user.name || '',
                        email: data.user.email || '',
                        hospital_name: data.user.hospital_name || ''
                    });
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: profile.name,
                    hospital_name: profile.hospital_name
                })
            });

            if (res.ok) {
                toast.success("Settings saved successfully!");
            } else {
                toast.error("Failed to save settings");
            }
        } catch (err) {
            toast.error("An error occurred");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight text-foreground">Clinic Settings</h1>
                <p className="text-muted-foreground text-lg">Manage your hospital affiliation and practice area.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                <Card className="p-8 shadow-xl border-border/50 bg-card/50 backdrop-blur rounded-[32px]">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">Full Name</Label>
                                <Input
                                    id="name"
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    className="h-14 bg-secondary/30 border-none rounded-2xl text-lg font-medium focus:ring-2 focus:ring-primary shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">Email Address</Label>
                                <Input
                                    id="email"
                                    value={profile.email}
                                    disabled
                                    className="h-14 bg-secondary/10 border-none rounded-2xl text-lg opacity-60 font-medium cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="hospital" className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">Hospital / Clinic Name</Label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <Input
                                    id="hospital"
                                    placeholder="e.g. Aster Medcity, Kochi"
                                    value={profile.hospital_name}
                                    onChange={(e) => setProfile({ ...profile, hospital_name: e.target.value })}
                                    className="h-14 pl-12 bg-secondary/30 border-none rounded-2xl text-lg font-medium focus:ring-2 focus:ring-primary shadow-inner"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground italic px-1 pt-2">
                                Patients will see your profile if they are near this hospital. Tip: Include city name for better accuracy.
                            </p>
                        </div>
                    </div>
                </Card>

                <div className="flex justify-end gap-4">
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="h-14 px-10 rounded-2xl font-black text-lg shadow-xl hover:-translate-y-1 transition-all gap-2"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
}
