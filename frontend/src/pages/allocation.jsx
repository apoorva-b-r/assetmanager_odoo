import React, { useState } from 'react';

export default function Allocation() {
  const [assetId, setAssetId] = useState('');
  const [assignee, setAssignee] = useState('');
  const [deadline, setDeadline] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  // Built-in initial tracking state matrix
  const [history, setHistory] = useState([
    {
      id: 1,
      date: '2026-07-10',
      action: 'Returned',
      actor: 'Alex Mercer',
      condition: 'Excellent',
      notes: 'Returned ahead of project closeout.'
    },
    {
      id: 2,
      date: '2026-05-01',
      action: 'Allocated',
      actor: 'Alex Mercer',
      condition: 'Sandbox Mode',
      notes: 'Expected Return: 2026-07-10 | Teammate Offline Bypass'
    }
  ]);

  const handleCommitAllocation = (e) => {
    e.preventDefault();
    if (!assetId || !assignee) return;

    const newEvent = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      action: 'Allocated',
      actor: assignee,
      condition: 'Good',
      notes: `Target Asset: ${assetId} | Deadline: ${deadline || 'None Specified'}`
    };

    setHistory([newEvent, ...history]);
    setStatusMsg(`Successfully committed system allocation for ${assetId}!`);

    // Clear form inputs
    setAssetId('');
    setAssignee('');
    setDeadline('');

    setTimeout(() => setStatusMsg(''), 4000);
  };

  return (
    <div className="p-8 bg-[#F8F9FC] min-h-screen">
      {/* Header Context Banner */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Allocation & Transfer Workbench</h1>
        <p className="text-slate-500 mt-1 text-sm">Assign structural physical assets to environments and handle dynamic title transfers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Requisition Engine Configuration Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-800 mb-4">New Asset Allocation Request</h2>

          <form onSubmit={handleCommitAllocation} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Target Asset</label>
              <select
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
              >
                <option value="">Choose asset from catalog...</option>
                <option value="MacBook Pro M3 (Tag: #E409)">MacBook Pro M3 (Tag: #E409)</option>
                <option value="iPad Pro 12.9 (Tag: #E291)">iPad Pro 12.9 (Tag: #E291)</option>
                <option value="Dell UltraSharp 32 (Tag: #M981)">Dell UltraSharp 32 (Tag: #M981)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Assignee (Employee / Department)</label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
              >
                <option value="">Select individual recipient...</option>
                <option value="Alex Mercer">Alex Mercer (Engineering)</option>
                <option value="Sarah Connor">Sarah Connor (Operations)</option>
                <option value="Bruce Wayne">Bruce Wayne (Management)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Expected Return Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm mt-2"
            >
              Commit System Allocation
            </button>
          </form>
        </div>

        {/* Master History Tracker Ledger Log */}
        <div className="lg:col-span-2 space-y-4">
          {statusMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-sm font-medium transition-all">
              ✨ {statusMsg}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Asset History Tracker</h2>
            <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-6">
              {history.map((item) => (
                <div key={item.id} className="relative">
                  {/* Ledger node bullet pointer */}
                  <span className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${item.action === 'Allocated' ? 'bg-indigo-600' : 'bg-slate-400'
                    }`} />

                  <div className="bg-slate-50/60 p-4 rounded-xl border border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${item.action === 'Allocated' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                        {item.action}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{item.date}</span>
                    </div>

                    <p className="text-sm font-medium text-slate-700">
                      Actor: <span className="text-slate-900 font-semibold">{item.actor}</span>
                    </p>

                    {item.condition && (
                      <p className="text-xs text-slate-500 mt-1 italic">
                        Condition: {item.condition}
                      </p>
                    )}

                    <p className="text-xs text-slate-400 mt-2 bg-white px-2.5 py-1.5 rounded-md border border-slate-100">
                      {item.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}