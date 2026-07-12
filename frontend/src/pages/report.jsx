import React from 'react';

export default function Reports() {
  return (
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Telemetry & Metrics Analysis</h1>
        <p className="text-slate-500 mt-1 text-sm">Generate inventory lifecycle summaries, depreciation models, and tracking vectors.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-2">Quarterly Capital Asset Turnover</h3>
          <p className="text-xs text-slate-400 mb-4">Hardware lifecycle evaluation metrics log summary</p>
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 w-[78%]"></div>
          </div>
          <span className="text-xs font-semibold text-slate-600 mt-2 block">78% efficiency target hit</span>
        </div>
      </div>
    </div>
  );
}