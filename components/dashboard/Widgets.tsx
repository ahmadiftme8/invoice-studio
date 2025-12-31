'use client';

// Calendar Widget (Allowed to be White)
export function CalendarWidget() {
  const date = new Date();
  const day = date.getDate();
  // FORCE en-US to prevent hydration mismatches with server (which defaults to en or system)
  const month = date.toLocaleString('en-US', { month: 'short' });

  return (
    <div 
      className="flex flex-col h-full w-full items-center justify-center rounded-[40px] dark:bg-gray-800 p-4 text-center shadow-sm group transition-transform hover:scale-[1.05]"
      style={{
        backgroundColor: 'var(--white)',
      }}
    >
        <span className="text-md font-black text-red-500 dark:text-red-400 uppercase tracking-widest">{month}</span>
        <span className="text-5xl font-black text-[#20272e] dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>{day}</span>
    </div>
  );
}

// Goal Widget (Transparent or Soft Pastel)
export function GoalWidget() {
  return (
    <div 
      className="flex flex-col h-full w-full items-center justify-center rounded-[40px] dark:bg-gray-800/40 backdrop-blur-sm p-4 relative transition-transform hover:scale-[1.05] shadow-sm"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
      }}
    >
        <div className="relative h-24 w-24">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                    className="dark:text-gray-700"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    style={{ color: '#e5e7eb' }}
                />
                <path
                    className="dark:text-[#f9fafb]"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray="75, 100"
                    strokeLinecap="round"
                    style={{ color: 'var(--ebony-clay)' }}
                />
            </svg>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-black dark:text-[#f9fafb]" style={{ color: 'var(--ebony-clay)' }}>
                75%
            </div>
        </div>
        <span className="mt-2 text-xs font-bold dark:text-gray-400" style={{ color: '#6b7280' }}>Monthly Goal</span>
    </div>
  );
}

// Avatar Stack (Transparent)
export function AvatarStack() {
    const clients = [
        { initial: "A", color: "bg-blue-200 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" },
        { initial: "F", color: "bg-pink-200 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300" },
        { initial: "R", color: "bg-yellow-200 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300" },
    ];
    
    return (
        <div 
          className="flex flex-col h-full w-full items-center justify-center rounded-[40px] dark:bg-gray-800/40 p-4 transition-transform hover:scale-[1.05]"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
          }}
        >
            <div className="flex -space-x-4">
                {clients.map((c, i) => (
                    <div key={i} className={`h-12 w-12 flex items-center justify-center rounded-full border-4 border-[#f4f4f4] dark:border-gray-800 ${c.color} text-sm font-black`}>
                        {c.initial}
                    </div>
                ))}
            </div>
             <span className="mt-2 text-xs font-bold dark:text-gray-400" style={{ color: '#6b7280' }}>Recent Clients</span>
        </div>
    );
}
