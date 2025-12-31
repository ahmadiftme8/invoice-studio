'use client';

import { Search, Bell, ChevronDown } from 'lucide-react';

export function Header({ title }: { title?: string }) {
  // Use passed title directly as it contains the specific greeting requested
  const greeting = title || "Good Morning, Fateme";

  return (
    <header className="flex w-full flex-wrap items-center justify-between gap-6 px-8 py-6">
      {/* Greeting Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold dark:text-[#f9fafb] tracking-tight flex items-center gap-2" style={{ color: 'var(--ebony-clay)' }}>
          {greeting}! ☀️
        </h1>
        <p className="text-sm font-bold dark:text-gray-500" style={{ color: '#9ca3af' }}>
          Let's make today productive.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-end gap-6">
        {/* Search Bar - Transparent/Soft */}
        <div className="relative hidden md:block w-96">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 dark:text-gray-500" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search..."
            className="h-12 w-full rounded-full border-none dark:bg-gray-800 py-2 pl-12 pr-4 text-sm font-extrabold dark:text-gray-200 shadow-sm outline-none ring-1 ring-transparent dark:placeholder:text-gray-500 focus:ring-2 dark:focus:ring-[#8b7ba8]"
            style={{ 
              backgroundColor: 'var(--white)',
              color: '#374151',
              '--tw-placeholder-opacity': '1',
            } as React.CSSProperties & { '--tw-placeholder-opacity'?: string }}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 dark:bg-gray-800 p-2 rounded-full shadow-sm border border-transparent dark:border-gray-700" style={{ backgroundColor: 'var(--white)' }}>
            <button className="relative flex h-10 w-10 items-center justify-center rounded-full dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700" style={{ color: '#9ca3af' }}>
                 <Bell className="h-5 w-5" />
                 <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-400 dark:bg-red-500 ring-2 dark:ring-gray-800" style={{ '--tw-ring-color': 'var(--white)' } as React.CSSProperties}></span>
            </button>
            <div className="h-8 w-[1px] dark:bg-gray-700 mx-1" style={{ backgroundColor: '#f3f4f6' }}></div>
             
             {/* User Profile */}
            <button className="flex items-center gap-3 pr-2 pl-1">
                <div className="h-9 w-9 rounded-full dark:from-[#4a2a3a] dark:to-[#3d2a4a] border-2 dark:border-gray-800 shadow-md" style={{ background: 'linear-gradient(to top right, var(--pale-rose), var(--prelude))', borderColor: 'var(--white)' }}></div>
                <div className="hidden lg:flex flex-col items-start gap-0.5">
                    <span className="text-xs font-black dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>Fateme</span>
                    <span className="text-[10px] font-bold dark:text-gray-500" style={{ color: '#9ca3af' }}>Admin</span>
                </div>
                 <ChevronDown className="h-4 w-4 dark:text-gray-500" style={{ color: '#9ca3af' }} />
            </button>
        </div>
      </div>
    </header>
  );
}
