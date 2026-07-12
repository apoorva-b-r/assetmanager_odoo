import React from 'react';

export default function Notifications() {
  return (
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Broadcast Inbox</h1>
        <p className="text-slate-500 mt-1 text-sm">System allocation requests and structural device change tracking triggers.</p>
      </div>
      <div className="space-y-3 max-w-3xl">
        <div className="bg-white p-4 rounded-xl border-l-4 border-indigo-600 shadow-sm flex items-start gap-3">
          <span className="text-base">🔔</span>
          <div>
            <h4 className="text-sm font-semibold text-slate-800">Return Deadline Warning</h4>
            <p className="text-xs text-slate-500 mt-0.5">MacBook Pro #E409 allocation assignment is due for return by Alex Mercer in 48 hours.</p>
          </div>
        </div>
      </div>
    </div>
  );
}