'use client';

import { Button } from '@/components/ui/button';
import { Heart, Activity, FileText, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">ElderCare</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-primary transition-colors">How it Works</Link>
            <Link href="#about" className="hover:text-primary transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-bold text-lg">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="font-bold text-lg bg-primary hover:bg-primary/90 px-6">Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] -z-10 animate-pulse" />

        <div className="max-w-7xl mx-auto px-6 text-center lg:text-left grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in slide-in-from-left-8 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm tracking-widest uppercase">
              <Activity className="w-4 h-4" />
              Advanced Health Management
            </div>
            <h1 className="text-6xl md:text-7xl font-extrabold text-foreground leading-[1.1] tracking-tighter">
              Care for your <span className="text-primary italic">Elderly</span> with Confidence.
            </h1>
            <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
              The all-in-one platform for managing health reports, appointments, and daily wellness for your loved ones. Experience peace of mind with ElderCare.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/signup">
                <Button className="h-16 px-10 text-xl font-bold bg-primary hover:bg-primary/90 rounded-2xl shadow-xl hover:shadow-primary/20 transition-all flex items-center gap-3 w-full">
                  Start Caring Now
                  <ArrowRight className="w-6 h-6" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" className="h-16 px-10 text-xl font-bold rounded-2xl border-2 hover:bg-secondary transition-all w-full">
                  Explore Features
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative animate-in zoom-in duration-1000">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] -z-10" />
            <div className="relative bg-card/50 backdrop-blur-xl border border-border/50 rounded-[40px] p-8 shadow-2xl overflow-hidden group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold">Health Metric</h3>
                    <p className="text-sm text-muted-foreground">Daily Update</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-primary">98%</span>
              </div>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-secondary/50 rounded-2xl animate-pulse" style={{ width: `${100 - (i * 10)}%` }} />
                ))}
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="h-32 bg-primary/10 rounded-[30px]" />
                <div className="h-32 bg-accent/10 rounded-[30px]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-32 bg-secondary/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Everything you need.</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We've built the most comprehensive health management system for seniors and their caregivers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: 'Lab Reports',
                desc: 'Upload, manage, and track all medical lab reports in one secure place with AI-driven insights.'
              },
              {
                icon: Calendar,
                title: 'Appointments',
                desc: 'Never miss a checkup. Manage medical appointments with smart reminders and history tracking.'
              },
              {
                icon: Heart,
                title: 'Health Summary',
                desc: 'Get a holistic view of vital health metrics including blood pressure, sugar, and more.'
              },
            ].map((f, i) => (
              <Card key={i} className="p-10 border-none bg-card hover:bg-card/80 shadow-xl hover:shadow-2xl transition-all group cursor-pointer rounded-[32px]">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <f.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">{f.desc}</p>
                <div className="mt-8 flex items-center gap-2 text-primary font-bold group-hover:gap-4 transition-all">
                  Learn more <ArrowRight className="w-5 h-5" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">ElderCare</span>
            </div>
            <p className="text-lg text-muted-foreground max-w-sm">
              Empowering families to provide the best care for their loved ones through smart health tracking.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-lg">Product</h4>
            <ul className="space-y-2 text-muted-foreground font-medium">
              <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Updates</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-lg">Company</h4>
            <ul className="space-y-2 text-muted-foreground font-medium">
              <li><Link href="#" className="hover:text-primary transition-colors">About</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-border text-center text-muted-foreground font-medium">
          © {new Date().getFullYear()} ElderCare Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
