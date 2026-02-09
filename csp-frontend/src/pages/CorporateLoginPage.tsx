import React from 'react';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { PhoneNumberForm } from '@/components/auth/PhoneNumberForm';
import { cn } from '@/lib/utils';

interface CorporateLoginPageProps {
    onSuccess: () => void;
    onSignUp: (token: string, avatar?: string | null) => void;
    step: 'signin' | 'phone';
    token: string | null;
    avatar?: string | null; // Add avatar prop (passed from App.tsx or parent state)
}

export function CorporateLoginPage({ onSuccess, onSignUp, step, token, avatar }: CorporateLoginPageProps) {
    return (
        <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden">
            {/* Left Panel - Brand & Hero (Hidden on mobile, visible on lg screens) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 text-white flex-col justify-between p-12 overflow-hidden">

                {/* Abstract Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 C 20 0 50 0 100 100 Z" fill="hsl(36, 95%, 50%)" />
                        <circle cx="20" cy="20" r="20" fill="hsl(36, 95%, 50%)" opacity="0.5" />
                        <rect x="60" y="60" width="30" height="30" fill="hsl(36, 95%, 50%)" opacity="0.3" transform="rotate(45 75 75)" />
                    </svg>
                    <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black/80" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <img src="/pi-dot-logo.png" alt="PI DOT" className="h-12 w-auto mb-8" />
                    <h1 className="text-5xl font-bold tracking-tight mb-6 leading-tight">
                        Corporate <br />
                        <span className="text-[hsl(36,95%,50%)]">Simulation</span> <br />
                        Program
                    </h1>
                    <p className="text-zinc-400 text-xl max-w-md leading-relaxed">
                        Experience real-world corporate scenarios.
                        Interact with AI counterparts.
                        Master the global economy.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-zinc-500 font-medium">
                    © 2024 PI DOT. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
                <div className="w-full max-w-md space-y-8">

                    {/* Mobile Logo (Visible only on mobile/tablet) */}
                    <div className="lg:hidden flex flex-col items-center mb-8">
                        <img src="/pi-dot-logo.png" alt="PI DOT" className="h-10 w-auto mb-4" />
                        <h2 className="text-2xl font-bold text-center">Corporate Simulation</h2>
                    </div>

                    {/* Redundant headers removed here */}

                    <div className="bg-card border shadow-sm rounded-xl p-6 md:p-8">
                        {step === 'signin' ? (
                            <div className="space-y-6">
                                <GoogleSignIn onSuccess={onSuccess} onSignUp={onSignUp} />

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-card px-2 text-muted-foreground">
                                            Secure Access
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-center text-muted-foreground px-4">
                                    By continuing, you agree to the Corporate Simulation Program's Terms of Service and Privacy Policy.
                                </p>
                            </div>
                        ) : token ? (
                            <PhoneNumberForm token={token} avatar={avatar} onSuccess={onSuccess} />
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
