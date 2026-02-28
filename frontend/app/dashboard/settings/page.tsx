'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { User, Bell, Eye, Lock, Save, Loader2, Globe } from 'lucide-react';
import { PhoneInput } from '@/components/ui/phone-input';
import { useAppearance } from '@/components/AppearanceProvider';

export default function SettingsPage() {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        dob: ''
    });
    const [guardianPhone, setGuardianPhone] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingGuardian, setIsSavingGuardian] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const { highContrast, setHighContrast, textSize, setTextSize, isMounted } = useAppearance();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, guardianRes] = await Promise.all([
                    fetch('/api/user/profile'),
                    fetch('/api/user/guardian')
                ]);

                const profileData = await profileRes.json();
                const guardianData = await guardianRes.json();

                if (profileData.user) setProfile(profileData.user);
                if (guardianData.guardianPhone) setGuardianPhone(guardianData.guardianPhone);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                body: JSON.stringify(profile),
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                alert('Profile updated successfully!');
            }
        } catch (error) {
            console.error('Failed to save profile:', error);
            alert('Failed to save profile');
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleSaveGuardian = async () => {
        setIsSavingGuardian(true);
        try {
            const res = await fetch('/api/user/guardian', {
                method: 'PATCH',
                body: JSON.stringify({ guardianPhone }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                alert('Guardian contact saved successfully!');
            }
        } catch (error) {
            console.error('Failed to save guardian:', error);
            alert('Failed to save guardian contact');
        } finally {
            setIsSavingGuardian(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h2 className="text-3xl font-bold">Settings</h2>
                <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Profile Settings */}
                    <Card className="p-10 shadow-xl border-border/50 bg-card/50 backdrop-blur rounded-[40px]">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <User className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold">Personal Information</h3>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-foreground/70 uppercase tracking-widest px-1">Full Name</label>
                                <Input
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    className="h-14 text-lg bg-background/50 border-border/50"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-foreground/70 uppercase tracking-widest px-1">Email Address</label>
                                <Input
                                    value={profile.email}
                                    disabled
                                    className="h-14 text-lg bg-background/20 border-border/50 cursor-not-allowed opacity-70"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-foreground/70 uppercase tracking-widest px-1">Phone Number</label>
                                <PhoneInput
                                    value={profile.phone}
                                    onPhoneChange={(val) => setProfile({ ...profile, phone: val })}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-foreground/70 uppercase tracking-widest px-1">Date of Birth</label>
                                <Input
                                    type="date"
                                    value={profile.dob}
                                    onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                                    className="h-14 text-lg bg-background/50 border-border/50"
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleSaveProfile}
                            disabled={isSavingProfile || isLoading}
                            className="mt-10 h-14 px-8 text-lg font-bold gap-2 shadow-lg"
                        >
                            {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {isSavingProfile ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </Card>

                    {/* Guardian Settings */}
                    <Card className="p-10 shadow-xl border-border/50 bg-card/50 backdrop-blur rounded-[40px]">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <Bell className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-2xl font-bold">Emergency Guardian</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-foreground/70 uppercase tracking-widest px-1">Guardian Phone Number</label>
                                <PhoneInput
                                    value={guardianPhone}
                                    onPhoneChange={(val) => setGuardianPhone(val)}
                                    placeholder="Enter guardian phone"
                                />
                                <p className="text-xs text-muted-foreground px-1">
                                    This number will be notified immediately if your vitals cross critical thresholds.
                                </p>
                            </div>
                            <Button
                                onClick={handleSaveGuardian}
                                disabled={isSavingGuardian || isLoading}
                                className="h-14 px-8 text-lg font-bold gap-2 shadow-lg bg-red-600 hover:bg-red-700"
                            >
                                {isSavingGuardian ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {isSavingGuardian ? 'Saving...' : 'Save Guardian Info'}
                            </Button>
                        </div>
                    </Card>

                    {/* Security Settings */}
                    <Card className="p-10 shadow-xl border-border/50 bg-card/50 backdrop-blur rounded-[40px]">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Lock className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold">Security</h3>
                        </div>
                        <p className="text-muted-foreground mb-8 font-medium">Manage your password and authentication methods.</p>
                        <Button variant="outline" className="h-12 px-6 font-bold rounded-xl">Change Password</Button>
                    </Card>
                </div>

                <div className="space-y-8">
                    {/* Notifications */}
                    <Card className="p-10 shadow-xl border-border/50 bg-card/50 backdrop-blur rounded-[40px]">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Bell className="w-6 h-6 text-primary" />
                            </div>
                            <h4 className="text-xl font-bold">Notifications</h4>
                        </div>
                        <div className="space-y-6">
                            {[
                                { label: 'Health Alerts', enabled: true },
                                { label: 'Appointment Reminders', enabled: true },
                                { label: 'System Updates', enabled: false },
                            ].map((s, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-secondary/30 p-4 rounded-2xl">
                                    <span className="font-bold">{s.label}</span>
                                    <div className={`w-12 h-7 rounded-full transition-colors cursor-pointer ${s.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full m-1 transition-transform ${s.enabled ? 'translate-x-5' : ''}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Display */}
                    <Card className="p-10 shadow-xl border-border/50 bg-card/50 backdrop-blur rounded-[40px]">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Eye className="w-6 h-6 text-primary" />
                            </div>
                            <h4 className="text-xl font-bold">Appearance</h4>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-secondary/30 p-4 rounded-2xl">
                                <span className="font-bold">High Contrast</span>
                                <div
                                    className={`w-12 h-7 rounded-full cursor-pointer transition-colors ${highContrast ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                                    onClick={() => setHighContrast(!highContrast)}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full m-1 transition-transform ${highContrast ? 'translate-x-5' : ''}`} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <span className="font-bold px-1">Text Size</span>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        variant={textSize === 'small' ? 'default' : 'outline'}
                                        className="font-bold"
                                        onClick={() => setTextSize('small')}
                                    >Small</Button>
                                    <Button
                                        variant={textSize === 'default' ? 'default' : 'outline'}
                                        className="font-bold"
                                        onClick={() => setTextSize('default')}
                                    >Default</Button>
                                    <Button
                                        variant={textSize === 'large' ? 'default' : 'outline'}
                                        className="font-bold"
                                        onClick={() => setTextSize('large')}
                                    >Large</Button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <span className="font-bold px-1 flex items-center gap-2">
                                    <Globe className="w-4 h-4" /> Language
                                </span>
                                <select
                                    className="w-full h-12 px-4 rounded-xl border border-border/50 bg-background/50 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                                    onChange={(e) => {
                                        const lang = e.target.value;
                                        // This triggers the Google Translate hidden select
                                        const selectElement = document.querySelector('.goog-te-combo') as HTMLSelectElement;
                                        if (selectElement) {
                                            selectElement.value = lang;
                                            selectElement.dispatchEvent(new Event('change'));
                                        } else {
                                            console.warn('Google Translate selector not found yet');
                                        }
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Select language...</option>
                                    <option value="en">English</option>
                                    <option value="ml">Malayalam (മലയാളം)</option>
                                    <option value="hi">Hindi (हिन्दी)</option>
                                    <option value="ta">Tamil (தமிழ்)</option>
                                    <option value="te">Telugu (తెలుగు)</option>
                                    <option value="mr">Marathi (मराठी)</option>
                                    <option value="ur">Urdu (اردو)</option>
                                </select>
                                <p className="text-xs text-muted-foreground px-1">
                                    Instantly translates the entire application.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
