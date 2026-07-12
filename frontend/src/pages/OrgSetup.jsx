import React from 'react';

export default function OrgSetup() {
  return (
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Organization Configuration</h1>
        <p className="text-slate-500 mt-1 text-sm">Set up business units, structural divisions, and site authorization matrix clearances.</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-2xl">
        <h3 className="text-base font-bold text-slate-800 mb-4">Operational Departments</h3>
        <div className="space-y-2">
          {['Engineering Hub', 'Operations & Logistics', 'Marketing Suite', 'Executive Office'].map(dept => (
            <div key={dept} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm font-medium text-slate-700">
              <span>{dept}</span>
              <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-md">Active Node</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}