'use client';

import { RevenueCard, InvoicesCard, ClientsCard, WorksCard } from "@/components/dashboard/SummaryCards";
import { RecentInvoicesList } from "@/components/dashboard/RecentInvoicesList";
import { CalendarWidget, GoalWidget, AvatarStack } from "@/components/dashboard/Widgets";

export default function DashboardPage() {
  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 max-h-screen overflow-hidden">
      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 auto-rows-[160px] gap-6 p-4">
        
        {/* 1. Revenue Hero (Spans 2 cols, 2 rows) */}
        <div className="col-span-1 md:col-span-2 row-span-2">
            <RevenueCard />
        </div>

        {/* 2. Invoices (1 col, 1 row) */}
        <div className="col-span-1 row-span-1">
             <InvoicesCard />
        </div>

        {/* 3. Clients (1 col, 1 row) */}
        <div className="col-span-1 row-span-1">
             <ClientsCard />
        </div>

        {/* 4. Vertical Activity Bar (Spans 2 cols, 3 rows - wider for better text display) */}
        <div className="col-span-1 md:col-span-4 lg:col-span-2 lg:row-span-3">
             <RecentInvoicesList />
        </div>

        {/* Row 2 Extras */}
        
        {/* 5. Works (1 col, 1 row) */}
        <div className="col-span-1 row-span-1">
             <WorksCard />
        </div>

        {/* 6. Calendar Widget (1 col, 1 row) */}
        <div className="col-span-1 row-span-1">
             <CalendarWidget />
        </div>

        {/* Row 3 -  Widgets */}

        {/* 7. Goal Widget (1 col, 1 row) */}
        <div className="col-span-1 row-span-1">
             <GoalWidget />
        </div>

        {/* 8. Avatar Stack (1 col, 1 row) */}
        <div className="col-span-1 row-span-1">
             <AvatarStack />
        </div>

         {/* 9. Purple Banner (Spans 2 cols, 1 row) */}
        <div 
          className="col-span-1 md:col-span-2 row-span-1 rounded-[40px] dark:bg-[#2d2835] p-8 text-[#20272e] dark:text-[#f9fafb] flex items-center justify-between shadow-none relative overflow-hidden group"
          style={{
            backgroundColor: 'var(--prelude)',
          }}
        >
             <div className="z-10 flex flex-col gap-1">
                <h3 className="font-black text-2xl tracking-tight" style={{ color: 'var(--ebony-clay)' }}>Unlock Pro ⚡️</h3>
                <p className="dark:text-[#f9fafb] opacity-60 text-sm font-bold" style={{ color: 'var(--ebony-clay)' }}>Get advanced analytics.</p>
             </div>
             <button className="z-10 rounded-full dark:bg-[#f9fafb] text-white dark:text-[#20272e] px-6 py-3 text-sm font-black hover:scale-105 transition-transform" style={{ backgroundColor: 'var(--ebony-clay)', color: 'var(--button-text-color)' }}>
                 UPGRADE 
             </button>
             
             {/* Decorative */}
             <div className="absolute right-[-10%] top-[-50%] h-64 w-64 bg-white dark:bg-gray-800 rounded-full blur-[60px] opacity-40 dark:opacity-20 group-hover:opacity-60 dark:group-hover:opacity-30 transition-opacity"></div>
        </div>

      </div>
    </div>
  );
}
