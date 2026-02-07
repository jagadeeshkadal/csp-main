import React from 'react';
import { cn } from '@/lib/utils';

interface CorporateLayoutProps {
    children: React.ReactNode;
    step: 'signin' | 'phone';
}

export function CorporateLayout({ children, step }: CorporateLayoutProps) {
    return (
        <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden relative">

            {/* Stunning Background - Applied Globally for Seamless Look */}
            <div className="absolute inset-0 z-0 bg-zinc-950 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black opacity-90" />

                {/* Abstract Geometric Pattern - The part user loved */}
                <div className="absolute inset-0 opacity-20">
                    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="hsl(36, 95%, 50%)" />
                        <circle cx="20" cy="20" r="20" fill="hsl(36, 95%, 50%)" opacity="0.5" />
                        <rect x="60" y="60" width="30" height="30" fill="hsl(36, 95%, 50%)" opacity="0.3" transform="rotate(45 75 75)" />
                    </svg>
                </div>

                {/* Subtle Grid Overlay */}
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }}>
                </div>
            </div>

            {/* Left Panel - Brand & Hero */}
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 z-10">
                <div className="relative">
                    <img src="/pi-dot-logo.png" alt="PI DOT" className="h-12 w-auto mb-8" />
                    <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight text-white animate-in slide-in-from-left-10 duration-700">
                        Corporate <br />
                        <span className="text-[hsl(36,95%,50%)]">Simulation</span> <br />
                        Program
                    </h1>
                    <p className="text-zinc-400 text-xl max-w-md leading-relaxed animate-in slide-in-from-left-10 duration-700 delay-100">
                        Experience real-world corporate scenarios.
                        Interact with AI counterparts.
                        Master the global economy.
                    </p>
                </div>

                <div className="text-sm text-zinc-500 font-medium">
                    © 2024 PI DOT. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Login Form Container */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-10">

                <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500 delay-200">

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex flex-col items-center mb-8">
                        <img src="/pi-dot-logo.png" alt="PI DOT" className="h-10 w-auto mb-4" />
                        <h2 className="text-2xl font-bold text-center text-white">Corporate Simulation</h2>
                    </div>

                    {/* Just render children directly - GoogleSignIn is already a Card */}
                    {children}

                    {step === 'signin' && (
                        <div className="mt-8">
                            <p className="text-[10px] text-center text-zinc-500 px-4">
                                Protected by secure enterprise-grade authentication.
                                <br />
                                By continuing, you agree to our Terms of Service.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
