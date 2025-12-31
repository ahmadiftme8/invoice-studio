'use client';

import { ChevronRight, ArrowUpRight, ArrowDownLeft, Calendar, FileText, UserPlus, Mail } from 'lucide-react';

const ACTIVITY_DATA = [
    { id: 1, title: 'Payment from Aras', sub: 'Invoice #004', time: '2m ago', amount: '+ 12.5M', type: 'payment' },
    { id: 2, title: 'New Client: Sarah', sub: 'Onboarding', time: '1h ago', amount: '', type: 'user' },
    { id: 3, title: 'Invoice #005 Sent', sub: 'To: TechCorp', time: '3h ago', amount: 'Pending', type: 'invoice' },
    { id: 4, title: 'Server Maintenance', sub: 'Scheduled', time: '5h ago', amount: '', type: 'alert' },
    { id: 5, title: 'Payment from Omid', sub: 'Invoice #002', time: '1d ago', amount: '+ 4.2M', type: 'payment' },
    { id: 6, title: 'Project "Alpha" Done', sub: 'Completed', time: '1d ago', amount: '', type: 'work' },
];

function getIcon(type: string) {
    switch (type) {
        case 'payment': return <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shrink-0"><ArrowDownLeft className="h-5 w-5" /></div>;
        case 'user': return <div className="h-10 w-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0"><UserPlus className="h-5 w-5" /></div>;
        case 'invoice': return <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0"><FileText className="h-5 w-5" /></div>;
        case 'mail': return <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400 shrink-0"><Mail className="h-5 w-5" /></div>;
        default: return <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 shrink-0"><Calendar className="h-5 w-5" /></div>;
    }
}

export function RecentInvoicesList() {
  return (
    <div className="flex flex-col h-full rounded-[40px] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-xl font-black dark:text-[#f9fafb] tracking-tight" style={{ color: 'var(--ebony-clay)' }}>Recent Activity</h3>
        <button className="h-8 w-8 rounded-full dark:bg-gray-800/60 backdrop-blur-sm flex items-center justify-center hover:bg-white/80 dark:hover:bg-gray-800/80 shadow-sm transition-colors shrink-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
            <ChevronRight className="h-5 w-5 dark:text-gray-500" style={{ color: '#9ca3af' }} />
        </button>
      </div>

      {/* Activity List - Fully responsive, no truncation */}
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        {ACTIVITY_DATA.map((item) => (
            <div 
                key={item.id} 
                className="group flex items-start sm:items-center justify-between py-2.5 px-3 rounded-[20px] hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all cursor-pointer shrink-0 gap-3"
            >
                <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                     {getIcon(item.type)}
                     <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="text-sm font-bold dark:text-[#f9fafb] break-words" style={{ color: 'var(--ebony-clay)' }}>{item.title}</span>
                        <span className="text-xs font-bold dark:text-gray-500 break-words" style={{ color: '#9ca3af' }}>{item.sub}</span>
                     </div>
                </div>
                
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                    {item.amount && (
                        <span className={`text-sm font-bold whitespace-nowrap ${item.amount.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            {item.amount}
                        </span>
                    )}
                    <span className="text-[10px] font-bold dark:text-gray-500 uppercase whitespace-nowrap" style={{ color: '#9ca3af' }}>{item.time}</span>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
