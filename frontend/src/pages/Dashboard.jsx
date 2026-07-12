import React from 'react';

export default function Dashboard() {
  return (
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Command Center</h1>
        <p className="text-slate-500 mt-1 text-sm">Real-time telemetry overview of operational assets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Tracked Assets', count: '1,240', change: '+12 this week', icon: '📦' },
          { label: 'Active Allocations', count: '892', change: '82% utilization', icon: '📋' },
          { label: 'Pending Bookings', count: '14', change: 'Next up at 13:00', icon: '📅' },
          { label: 'Open Repairs', count: '3', change: '1 critical blocker', icon: '🔧' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-2">{stat.count}</h3>
              <p className="text-xs text-indigo-500 font-medium mt-1">{stat.change}</p>
            </div>
            <span className="text-2xl bg-slate-50 p-3 rounded-xl">{stat.icon}</span>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-2">System Status</h2>
        <p className="text-sm text-slate-500">All inventory systems running within nominal parameters.</p>
      </div>
    </div>
  );
}