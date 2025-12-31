'use client';

import { useTranslations } from 'next-intl';
import { ArrowUpRight, TrendingUp } from 'lucide-react';

// Hardcoded "Demo Mode" Data
const DATA = {
    revenue: "145,200,000",
    invoices: 12,
    clients: 24,
    works: 8
};

// 1. Revenue Card (Purple var(--prelude))
export function RevenueCard() {
  const t = useTranslations("dashboard");
  
  return (
    <div 
      className="flex h-full flex-col justify-between rounded-[40px] dark:bg-gradient-to-br dark:from-[#2d2835] dark:via-[#3d3545] dark:to-[#2d2835] p-8 text-[#20272e] dark:text-[#f9fafb] relative overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:shadow-[#d7cae8]/30 dark:hover:shadow-[#2d2835]/50"
      style={{
        background: 'linear-gradient(to bottom right, var(--prelude), #e8d5f5, var(--prelude))',
      }}
    >
        {/* Animated Background Waves - Stationary with Varying Amplitudes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Wave Layer 1 - Varying amplitudes with slow vertical animation */}
            <svg 
                className="absolute bottom-0 left-0 w-full h-full opacity-30 wave-amplitude-1"
                viewBox="0 0 1200 400" 
                preserveAspectRatio="none"
            >
                <path 
                    d="M0,250 Q150,120 300,200 Q450,280 600,180 Q750,80 900,220 Q1050,360 1200,200 L1200,400 L0,400 Z" 
                    fill="white" 
                    opacity="0.4"
                />
            </svg>
            
            {/* Wave Layer 2 - Different amplitude pattern */}
            <svg 
                className="absolute bottom-0 left-0 w-full h-full opacity-25 wave-amplitude-2"
                viewBox="0 0 1200 400" 
                preserveAspectRatio="none"
            >
                <path 
                    d="M0,300 Q200,180 400,280 Q600,180 800,250 Q1000,320 1200,220 L1200,400 L0,400 Z" 
                    fill="white" 
                    opacity="0.3"
                />
            </svg>
            
            {/* Wave Layer 3 - More dramatic amplitude variations */}
            <svg 
                className="absolute bottom-0 left-0 w-full h-full opacity-20 wave-amplitude-3"
                viewBox="0 0 1200 400" 
                preserveAspectRatio="none"
            >
                <path 
                    d="M0,350 Q100,250 200,320 Q300,200 500,300 Q700,150 900,280 Q1100,200 1200,250 L1200,400 L0,400 Z" 
                    fill="white" 
                    opacity="0.2"
                />
            </svg>

            {/* Floating Orbs */}
            <div className="absolute top-10 right-20 w-32 h-32 rounded-full bg-white/20 blur-2xl float-animation-1" />
            <div className="absolute top-32 left-16 w-24 h-24 rounded-full bg-white/15 blur-xl float-animation-2" />
            <div className="absolute bottom-20 right-40 w-40 h-40 rounded-full bg-white/10 blur-3xl float-animation-3" />

            {/* Animated Gradient Mesh */}
            <div className="absolute inset-0 opacity-30 mesh-animation" />
        </div>

        {/* Content */}
        <div className="z-10 flex justify-between items-start relative">
            <div>
                 <span className="text-sm font-bold opacity-60 uppercase tracking-widest dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>{t("cards.revenue")}</span>
                 <h2 className="mt-2 text-5xl font-black tracking-tight dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>
                    {DATA.revenue} <span className="text-xl font-bold opacity-50">IRR</span>
                </h2>
            </div>
             <div className="h-12 w-12 rounded-full bg-white/40 dark:bg-gray-800/40 flex items-center justify-center backdrop-blur-md shadow-lg">
                <TrendingUp className="h-6 w-6 dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }} />
            </div>
        </div>
        
        <div className="z-10 mt-6 flex items-center gap-3 relative">
             <div className="flex items-center gap-1 rounded-full dark:bg-[#f9fafb] px-4 py-2 text-sm font-bold text-white dark:text-[#20272e] shadow-lg hover:shadow-xl" style={{ backgroundColor: 'var(--ebony-clay)', color: 'var(--button-text-color)' }}>
                <ArrowUpRight className="h-4 w-4 text-white dark:text-[#20272e]" style={{ color: 'var(--button-text-color)' }} />
                <span style={{ color: 'var(--button-text-color)' }}>24%</span>
             </div>
             <span className="text-sm font-bold opacity-60 dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>vs last month</span>
        </div>

        {/* Animated Bottom Wave - Stationary with varying amplitudes */}
        <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none overflow-hidden">
             <svg 
                viewBox="0 0 1200 200" 
                preserveAspectRatio="none" 
                className="h-full w-full"
            >
                <path 
                    className="wave-bottom-1"
                    d="M0,160 Q150,80 300,120 Q450,160 600,100 Q750,40 900,110 Q1050,180 1200,130 L1200,200 L0,200 Z" 
                    fill="white" 
                    opacity="0.5"
                />
                <path 
                    className="wave-bottom-2"
                    d="M0,180 Q200,100 400,150 Q600,200 800,120 Q1000,60 1200,140 L1200,200 L0,200 Z" 
                    fill="white" 
                    opacity="0.3"
                />
             </svg>
        </div>
    </div>
  );
}

// 2. Invoices Card (Teal var(--geyser))
export function InvoicesCard() {
  const t = useTranslations("dashboard");
  return (
    <div 
      className="flex h-full flex-col justify-between rounded-[40px] dark:bg-[#2d3d3b] p-8 text-[#20272e] dark:text-[#f9fafb] transition-transform hover:scale-[1.02] relative overflow-hidden shadow-sm"
      style={{
        backgroundColor: 'var(--geyser)',
      }}
    >
         <div className="relative z-10 flex justify-between items-start">
             <span className="text-sm font-bold opacity-60 dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>{t("cards.invoices")}</span>
             <span className="text-3xl bg-white/40 dark:bg-gray-800/40 h-10 w-10 flex items-center justify-center rounded-full">🧾</span>
         </div>
         <h3 className="relative z-10 text-4xl font-black mt-2 dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>{DATA.invoices}</h3>
         <span className="relative z-10 text-xs font-bold opacity-60 uppercase tracking-wide dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>Pending Action</span>
    </div>
  );
}

// 3. Clients Card (Pink var(--pale-rose))
export function ClientsCard() {
  const t = useTranslations("dashboard");
  return (
    <div 
      className="flex h-full flex-col justify-between rounded-[40px] dark:bg-[#3d2a35] p-8 text-[#20272e] dark:text-[#f9fafb] transition-transform hover:scale-[1.02] relative overflow-hidden shadow-sm"
      style={{
        backgroundColor: 'var(--pale-rose)',
      }}
    >
          <div className="relative z-10 flex justify-between items-start">
             <span className="text-sm font-bold opacity-60 dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>{t("cards.clients")}</span>
             <span className="text-3xl bg-white/40 dark:bg-gray-800/40 h-10 w-10 flex items-center justify-center rounded-full">👥</span>
         </div>
         <h3 className="relative z-10 text-4xl font-black mt-2 dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>{DATA.clients}</h3>
         <span className="relative z-10 text-xs font-bold opacity-60 uppercase tracking-wide dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>Active Now</span>
    </div>
  );
}

// 4. Works Card (Yellow var(--cream-brulee))
export function WorksCard() {
  const t = useTranslations("dashboard");
  return (
    <div 
      className="flex h-full flex-col justify-between rounded-[40px] dark:bg-[#3d3526] p-8 text-[#20272e] dark:text-[#f9fafb] transition-transform hover:scale-[1.02] relative overflow-hidden shadow-sm"
      style={{
        backgroundColor: 'var(--cream-brulee)',
      }}
    >
          <div className="relative z-10 flex justify-between items-start">
             <span className="text-sm font-bold opacity-60 dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>{t("cards.works")}</span>
             <span className="text-3xl bg-white/40 dark:bg-gray-800/40 h-10 w-10 flex items-center justify-center rounded-full">🔨</span>
         </div>
         <h3 className="relative z-10 text-4xl font-black mt-2 dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>{DATA.works}</h3>
         <span className="relative z-10 text-xs font-bold opacity-60 uppercase tracking-wide dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>Services</span>
    </div>
  );
}
