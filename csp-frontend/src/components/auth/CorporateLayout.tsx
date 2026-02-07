import React from 'react';
import { cn } from '@/lib/utils';

interface CorporateLayoutProps {
    children: React.ReactNode;
    step: 'signin' | 'phone';
}

export function CorporateLayout({ children, step }: CorporateLayoutProps) {
    return (
        <div className="min-h-screen w-full flex bg-background text-foreground overflow-hidden relative">

            {/* Stunning Background - Applied Globally */}
            <div className="absolute inset-0 z-0 bg-zinc-950 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black opacity-90" />

                {/* Abstract Geometric Pattern - Offset to the right to leave space for logo */}
                <div className="absolute inset-0 opacity-20" style={{ transform: 'translateX(15%)' }}>
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
            <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 pl-8 pb-16 z-10">
                {/* Logo at top */}
                <div className="relative">
                    <img src="/pi-dot-logo.png" alt="PI DOT" className="h-6 w-auto" />
                </div>

                {/* Text content */}
                {/* Make text spacing "normal" (not congested) */}
                <div className="relative mt-auto pt-24 mb-16">
                    {/* Updated heading: text-[3.5rem] leading-[1.1] tracking-normal font-normal */}
                    <h1 className="text-[3.5rem] leading-[1.1] tracking-normal font-normal mb-8 animate-in slide-in-from-left-10 duration-700">
                        <span className="text-white">Corporate </span>
                        <span className="text-[hsl(36,95%,50%)]">Simulation</span><br />
                        <span className="text-white">Program</span>
                    </h1>
                    <p className="text-zinc-400 text-lg max-w-md leading-relaxed animate-in slide-in-from-left-10 duration-700 delay-100 font-light tracking-wide">
                        Experience real-world corporate scenarios.
                        Interact with AI counterparts.
                        Master the global economy.
                    </p>
                </div>

                {/* Footer at very bottom */}
                <div className="text-sm text-zinc-500 font-medium">
                    © 2026 PI DOT. All rights reserved.
                </div>
            </div>

            {/* Right Panel - Login Form Container */}
            {/* Center vertically (items-center), Right align (justify-end) */}
            <div className="w-full lg:w-1/2 flex items-center justify-end p-6 lg:p-12 relative z-10 h-screen">

                <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500 delay-200">


                    {/* Mobile Logo */}
                    <div className="lg:hidden flex flex-col items-center mb-8">
                        <img src="/pi-dot-logo.png" alt="PI DOT" className="h-8 w-auto mb-4" />
                        <h2 className="text-2xl font-bold text-center text-white">Corporate Simulation</h2>
                    </div>

                    {/* Sign In Form */}
                    {children}
                </div>
            </div>
        </div>
    );
}
