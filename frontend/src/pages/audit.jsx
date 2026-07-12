import React, { useState } from 'react';

// Baseline mockup data modeling active or historically logged cycles
const INITIAL_CYCLES = [
  {
    id: 'AC-2026-Q3',
    name: 'Q3 Audit: Engineering Dept',
    scope: 'Engineering (HQ - Floors 2 & 3)',
    dateRange: '1 Jul - 15 Jul',
    auditors: ['A. Rao', 'S. Iqbal'],
    status: 'Active',
    items: [
      { id: 'AF-003', name: 'Dell Laptop', expectedLocation: 'Desk E12', status: 'Verified' },
      { id: 'AF-9921', name: 'Office Chair', expectedLocation: 'Desk E14', status: 'Missing' },
      { id: 'AF-9838', name: 'Monitor', expectedLocation: 'Desk E15', status: 'Damaged' },
    ],
    history: ['Cycle initiated by Compliance Lead.', 'Auditors dispatched to floor labs.']
  },
  {
    id: 'AC-2026-M05',
    name: 'May Server Room Baseline',
    scope: 'Data Center Alpha',
    dateRange: '10 May - 12 May',
    auditors: ['T. Miller'],
    status: 'Closed',
    items: [
      { id: 'AF-040', name: 'Blade Server S1', expectedLocation: 'Rack A-04', status: 'Verified' },
      { id: 'AF-041', name: 'Blade Server S2', expectedLocation: 'Rack A-04', status: 'Verified' },
    ],
    history: ['Cycle initiated.', 'All assets matched physical footprints.', 'Cycle formally signed-off and frozen.']
  }
];

export default function AssetAuditWorkspace() {
  const [cycles, setCycles] = useState(INITIAL_CYCLES);
  const [activeCycleId, setActiveCycleId] = useState('AC-2026-Q3');

  // Multi-step Creation Panel Fields State
  const [newCycleName, setNewCycleName] = useState('');
  const [newScope, setNewScope] = useState('');
  const [newAuditors, setNewAuditors] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');

  // Target selected workspace item reference
  const currentCycle = cycles.find(c => c.id === activeCycleId) || cycles[0];

  // Logic calculation for automatic real-time discrepancy aggregation
  const flaggedItems = currentCycle ? currentCycle.items.filter(item => item.status === 'Missing' || item.status === 'Damaged') : [];
  const isClosed = currentCycle?.status === 'Closed';

  // Instantiate a fresh compliant validation window
  const handleCreateCycle = (e) => {
    e.preventDefault();
    if (!newCycleName || !newScope) return;

    const assignedAuditorsArray = newAuditors.split(',').map(s => s.trim()).filter(Boolean);

    const newlyMintedCycle = {
      id: `AC-2026-REC${Math.floor(100 + Math.random() * 900)}`,
      name: newCycleName,
      scope: newScope,
      dateRange: `${newStart || 'TBD'} - ${newEnd || 'TBD'}`,
      auditors: assignedAuditorsArray.length > 0 ? assignedAuditorsArray : ['System Automated Desk'],
      status: 'Active',
      // Generate some dummy baseline items matching scope context for simulation
      items: [
        { id: 'AF-1044', name: 'Logitech Conference Cam', expectedLocation: 'Room 401', status: 'Pending Verification' },
        { id: 'AF-3302', name: 'ThinkCentre Edge Node', expectedLocation: 'Lab Desk B', status: 'Pending Verification' },
        { id: 'AF-4419', name: 'Ultrawide Curved Array', expectedLocation: 'Design Studio 1', status: 'Pending Verification' }
      ],
      history: [`Audit Cycle created from management terminal covering ${newScope}.`]
    };

    setCycles([newlyMintedCycle, ...cycles]);
    setActiveCycleId(newlyMintedCycle.id);

    // Wipe forms fields back clear
    setNewCycleName('');
    setNewScope('');
    setNewAuditors('');
    setNewStart('');
    setNewEnd('');
  };

  // Immediate inline verification handler toggles used by auditors
  const updateItemStatus = (itemId, targetStatus) => {
    if (isClosed) return; // Disallow edits to frozen nodes

    setCycles(cycles.map(c => {
      if (c.id === activeCycleId) {
        const updatedItems = c.items.map(item => {
          if (item.id === itemId) return { ...item, status: targetStatus };
          return item;
        });
        return { ...c, items: updatedItems };
      }
      return c;
    }));
  };

  // Close cycle - sets status to frozen and posts history modifications
  const handleCloseCycle = () => {
    setCycles(cycles.map(c => {
      if (c.id === activeCycleId) {
        // Enumerate confirmation changes to history trail logs
        const missingCount = c.items.filter(i => i.status === 'Missing').length;
        const damagedCount = c.items.filter(i => i.status === 'Damaged').length;

        const closureLog = `Audit closed. Automation summary executed: Flagged ${missingCount} items as 'Lost' in master registers and redirected ${damagedCount} objects to Maintenance queue triage.`;

        return {
          ...c,
          status: 'Closed',
          history: [...c.history, closureLog]
        };
      }
      return c;
    }));
  };

  return (
    <div className="p-8 bg-[#F8F9FC] min-h-screen text-slate-800 font-sans">

      {/* Structural Header Context */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Compliance & Audit Engine</h1>
          <p className="text-sm text-slate-500 mt-1">Schedule spatial inventory validation cycles, map field teams, and sign-off verification trails.</p>
        </div>

        {/* Top Dropdown Switcher to quickly swap active focus contexts */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase pl-2">Select Target Cycle:</span>
          <select
            value={activeCycleId}
            onChange={(e) => setActiveCycleId(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-slate-50 p-1.5 rounded-lg border border-slate-200 focus:outline-none"
          >
            {cycles.map(c => (
              <option key={c.id} value={c.id}>{c.status === 'Closed' ? '🔒 ' : '⚡ '}{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">

        {/* Left Control Desk Panel: Setup Form + Cycle Metadata Log Details */}
        <div className="space-y-6 xl:col-span-1">

          {/* Form: Initiate New Compliance Session */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Initialize Audit Cycle</h2>
              <p className="text-xs text-slate-400 mt-0.5">Define target parameters to spin up a fresh operational ledger list.</p>
            </div>

            <form onSubmit={handleCreateCycle} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Cycle Descriptor Title</label>
                <input
                  type="text"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  placeholder="e.g., Q3 Engineering Sweep"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Scope Department / Location Target</label>
                <input
                  type="text"
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value)}
                  placeholder="e.g., HQ Floor 3 or IT Warehousing"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Assign Auditors (Comma-Separated)</label>
                <input
                  type="text"
                  value={newAuditors}
                  onChange={(e) => setNewAuditors(e.target.value)}
                  placeholder="A. Rao, S. Iqbal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Start Window</label>
                  <input type="text" placeholder="1 Jul" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">End Expected</label>
                  <input type="text" placeholder="15 Jul" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-center" />
                </div>
              </div>

              <button type="submit" className="w-full py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all mt-2 shadow-xs">
                Deploy Active Audit Cycle
              </button>
            </form>
          </div>

          {/* Audit History Log Tracker for Active Module Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-400">Cycle Timeline Audit Trail</h3>
            <div className="space-y-3 border-l-2 border-slate-100 pl-3 py-1">
              {currentCycle?.history.map((h, i) => (
                <p key={i} className="text-[11px] text-slate-500 leading-normal relative">
                  <span className="absolute -left-[16.5px] top-1 w-1.5 h-1.5 rounded-full bg-slate-400 ring-2 ring-white" />
                  {h}
                </p>
              ))}
            </div>
          </div>

        </div>

        {/* Right Working Grid Area: Active Verification Checklist & Auto-Generated Discrepancy Dashboard Row */}
        <div className="xl:col-span-3 space-y-6">

          {/* Target Highlight Board Detail Header Banner Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-md border border-indigo-100">{currentCycle?.id}</span>
                <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full ${isClosed ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                  {currentCycle?.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-2">{currentCycle?.name}</h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium">
                <p>📍 Scope: <span className="text-slate-800">{currentCycle?.scope}</span></p>
                <p>📅 Schedule: <span className="text-slate-800">{currentCycle?.dateRange}</span></p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 min-w-[200px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Assigned Audit Field Crew</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {currentCycle?.auditors.map((auditor, idx) => (
                  <span key={idx} className="bg-white px-2 py-0.5 rounded-md text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs">
                    👤 {auditor}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Verification Checklist Interactive Table Component */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Physical Inspection List Checkpoints</h3>
              <p className="text-xs text-slate-400">Match physical inventory to spatial targets. Changes lock permanently upon cycle signature closing execution.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-6">Asset Reference</th>
                    <th className="py-3 px-4">Expected Lab/Desk Location</th>
                    <th className="py-3 px-6 text-right">Verification Verification State Buttons</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {currentCycle?.items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">{item.id}</span>
                          <span className="text-slate-900 font-bold">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">{item.expectedLocation}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/40">
                          {['Verified', 'Missing', 'Damaged'].map(state => {
                            const isSelected = item.status === state;

                            // Tailwind logic styling rules matching colors
                            let activeStyle = '';
                            if (isSelected && state === 'Verified') activeStyle = 'bg-emerald-600 text-white shadow-xs';
                            if (isSelected && state === 'Missing') activeStyle = 'bg-rose-600 text-white shadow-xs';
                            if (isSelected && state === 'Damaged') activeStyle = 'bg-amber-500 text-white shadow-xs';

                            return (
                              <button
                                key={state}
                                type="button"
                                disabled={isClosed}
                                onClick={() => updateItemStatus(item.id, state)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${isSelected
                                    ? activeStyle
                                    : 'text-slate-500 hover:text-slate-800 disabled:opacity-40 disabled:hover:text-slate-500'
                                  }`}
                              >
                                {state}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SYSTEM AUTO-GENERATED DISCREPANCY REPORT MODULE */}
          <div className={`p-6 rounded-2xl border transition-all ${flaggedItems.length > 0
              ? 'bg-amber-50/40 border-amber-200 shadow-sm'
              : 'bg-slate-50/50 border-slate-200'
            }`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <h3 className="text-sm font-bold text-slate-900">System Discrepancy Aggregator</h3>
                </div>
                <p className="text-xs text-slate-500 max-w-xl">
                  Real-time compilation tracking variances. Closing this file triggers systemic registry re-evaluations automatically.
                </p>
              </div>

              <div className="text-right">
                <span className={`text-xs font-mono font-black px-3 py-1 rounded-full border ${flaggedItems.length > 0 ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-slate-100 text-slate-400'
                  }`}>
                  {flaggedItems.length} Flagged Variances Detected
                </span>
              </div>
            </div>

            {/* List Flagged Exceptions */}
            {flaggedItems.length > 0 ? (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {flaggedItems.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{item.name} <span className="text-[10px] font-mono text-slate-400">({item.id})</span></p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Location: {item.expectedLocation}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 font-bold rounded ${item.status === 'Missing' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                      🚨 {item.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 p-3 bg-white/50 text-center rounded-xl border border-dashed text-slate-400 text-xs">
                No inventory discrepancies currently calculated for this compliance ledger stack.
              </div>
            )}
          </div>

          {/* Action Sign-off Footer Block */}
          {!isClosed ? (
            <div className="flex items-center justify-end p-4 bg-slate-900 text-white rounded-2xl shadow-md gap-4">
              <p className="text-xs text-slate-400 max-w-md hidden md:block">
                <strong>Sign-off Lock Warning:</strong> Closing freezes validation parameters, switches confirmed-missing data to <code>Lost</code>, and dispatches damaged gear lists to triage desk queues automatically.
              </p>
              <button
                type="button"
                onClick={handleCloseCycle}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl transition-all shadow-md shrink-0"
              >
                Close Audit Cycle & Commit Adjustments
              </button>
            </div>
          ) : (
            <div className="p-4 bg-slate-100 border border-slate-200 text-center text-slate-500 text-xs font-bold rounded-2xl">
              🔒 This audit cycle ledger has been successfully closed, signed-off, and archived. System dependencies have updated.
            </div>
          )}

        </div>

      </div>

    </div>
  );
}