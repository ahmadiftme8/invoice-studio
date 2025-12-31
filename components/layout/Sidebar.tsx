'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Users, Briefcase, Settings, LogOut, Globe, Moon, Sun } from 'lucide-react';
import { useAccountingStore } from '@/lib/accounting-store';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: FileText, label: 'Invoices', href: '/invoices' },
  { icon: Users, label: 'Clients', href: '/clients' },
  { icon: Briefcase, label: 'Works', href: '/works' },
];

export function Sidebar() {
  const pathname = usePathname();
  const language = useAccountingStore((state) => state.settings.language ?? "en");
  const theme = useAccountingStore((state) => state.settings.theme ?? "light");
  const updateSettings = useAccountingStore((state) => state.updateSettings);

  const toggleLanguage = () => {
    const newLanguage = language === "fa" ? "en" : "fa";
    updateSettings({ language: newLanguage });
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    updateSettings({ theme: newTheme });
  };

  return (
    <aside className="hidden lg:flex flex-col items-center py-6 w-20" style={{ backgroundColor: 'var(--white)' }}>
      {/* Logo */}
      <div className="mb-12 flex h-12 w-12 items-center justify-center rounded-2xl dark:bg-[#f9fafb] shadow-sm shrink-0" style={{ backgroundColor: 'var(--ebony-clay)' }}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-white dark:text-[#20272e]"
          style={{ color: 'var(--button-text-color)' }}
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-8 w-full items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'text-white dark:bg-[#f9fafb] dark:text-[#20272e] shadow-xl dark:shadow-[#f9fafb]/30'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-[#20272e] dark:hover:text-[#f9fafb]'
              }`}
              style={isActive ? { backgroundColor: 'var(--ebony-clay)', color: 'var(--button-text-color)', boxShadow: '0 20px 25px -5px rgba(32, 39, 46, 0.3)' } : {}}
            >
              <item.icon className={`h-6 w-6 ${isActive ? 'stroke-2' : 'stroke-[2]'}`} style={isActive ? { color: 'var(--button-text-color)' } : {}} />
              
              {/* Tooltip */}
              <span className="absolute left-14 ml-2 hidden rounded-xl dark:bg-[#f9fafb] px-3 py-2 text-xs font-bold text-white dark:text-[#20272e] shadow-xl transition-all group-hover:block whitespace-nowrap z-50" style={{ backgroundColor: 'var(--ebony-clay)', color: 'var(--button-text-color)' }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-6 w-full items-center shrink-0">
        <button 
          onClick={toggleTheme}
          className="group relative flex h-12 w-12 items-center justify-center rounded-2xl text-gray-400 dark:text-gray-500 transition-colors hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-[#20272e] dark:hover:text-[#f9fafb]"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-6 w-6 stroke-[2]" />
          ) : (
            <Moon className="h-6 w-6 stroke-[2]" />
          )}
          
          {/* Tooltip */}
          <span className="absolute left-14 ml-2 hidden rounded-xl dark:bg-[#f9fafb] px-3 py-2 text-xs font-bold text-white dark:text-[#20272e] shadow-xl transition-all group-hover:block whitespace-nowrap z-50" style={{ backgroundColor: 'var(--ebony-clay)', color: 'var(--button-text-color)' }}>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </span>
        </button>

        <button 
          onClick={toggleLanguage}
          className="group relative flex h-12 w-12 items-center justify-center rounded-2xl text-gray-400 dark:text-gray-500 transition-colors hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-[#20272e] dark:hover:text-[#f9fafb]"
          title={language === "fa" ? "Switch to English" : "تبدیل به فارسی"}
        >
          <Globe className="h-6 w-6 stroke-[2]" />
          
          {/* Tooltip */}
          <span className="absolute left-14 ml-2 hidden rounded-xl dark:bg-[#f9fafb] px-3 py-2 text-xs font-bold text-white dark:text-[#20272e] shadow-xl transition-all group-hover:block whitespace-nowrap z-50" style={{ backgroundColor: 'var(--ebony-clay)', color: 'var(--button-text-color)' }}>
            {language === "fa" ? "English" : "فارسی"}
          </span>
          
          {/* Language indicator badge */}
          <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full dark:bg-[#f9fafb] text-[10px] font-black text-white dark:text-[#20272e] flex items-center justify-center dark:border-gray-800" style={{ backgroundColor: 'var(--ebony-clay)', color: 'var(--button-text-color)', borderColor: 'var(--white)', borderWidth: '2px' }}>
            {language === "fa" ? "ف" : "E"}
          </span>
        </button>
        
        <button className="flex h-12 w-12 items-center justify-center rounded-2xl text-gray-400 dark:text-gray-500 transition-colors hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-[#20272e] dark:hover:text-[#f9fafb]">
          <Settings className="h-6 w-6 stroke-[2]" />
        </button>
        
         <button className="flex h-12 w-12 items-center justify-center rounded-2xl text-gray-400 dark:text-gray-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400">
          <LogOut className="h-6 w-6 stroke-[2]" />
        </button>
      </div>
    </aside>
  );
}
