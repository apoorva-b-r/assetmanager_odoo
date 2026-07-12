import React, { useState } from 'react';

// Sample master list of assets to simulate database state
const INITIAL_ASSETS = [
  { id: 'AF-0114', name: 'Dell laptop', currentHolder: 'Priya Shah', department: 'Engineering', status: 'Allocated', expectedReturn: '2026-07-10' }, // Overdue!
  { id: 'AF-0220', name: 'MacBook Pro M3', currentHolder: '', department: '', status: 'Available', expectedReturn: '' },
  { id: 'AF-0315', name: 'iPad Pro 12.9', currentHolder: 'Arjun Nair', department: 'Design', status: 'Allocated', expectedReturn: '2026-08-15' },
];

const EMPLOYEES = ['Priya Shah', 'Raj Patel', 'Arjun Nair', 'Sarah Connor', 'Ananya Iyer'];
const DEPARTMENTS = ['Engineering', 'Operations', 'Design', 'Marketing'];

export default function Allocation() {
  // --- RBAC Identity Simulator State ---
  const [currentRole, setCurrentRole] = useState('Asset Manager'); // Options: 'Asset Manager', 'Employee'
  const [currentUser, setCurrentUser] = useState('Raj Patel');     // Simulated logged-in employee

  const [assets, setAssets] = useState(INITIAL_ASSETS);
  const [selectedAssetId, setSelectedAssetId] = useState('AF-0114');

  // Form States (Admin Only)
  const [allocateTo, setAllocateTo] = useState('');
  const [department, setDepartment] = useState('');
  const [returnDate, setReturnDate] = useState('');

  // Transfer States (Shared/Employee)
  const [transferTo, setTransferTo] = useState(''); // Admin can pick anyone, Employee defaults to themselves
  const [transferReason, setTransferReason] = useState('');

  // Return States (Admin Only)
  const [checkInCondition, setCheckInCondition] = useState('Good');
  const [checkInNotes, setCheckInNotes] = useState('');

  // Global Lists for Logs & Requests
  const [transferRequests, setTransferRequests] = useState([
    { id: 1, assetId: 'AF-0114', assetName: 'Dell laptop', from: 'Priya Shah', to: 'Raj Patel', requestedBy: 'Raj Patel', reason: 'Urgent debugging tasks', status: 'Pending' }
  ]);
  const [historyLogs, setHistoryLogs] = useState([
    { id: 1, assetId: 'AF-0114', date: 'Mar 12', message: 'Allocated to Priya Shah - Engineering' },
    { id: 2, assetId: 'AF-0114', date: 'Jan 04', message: 'Returned by Arjun Nair - condition: good' }
  ]);

  const currentAsset = assets.find(a => a.id === selectedAssetId);
  const isAllocated = currentAsset && currentAsset.status === 'Allocated';
  const isAdmin = currentRole === 'Asset Manager';

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date('2026-07-12');
  };

  // 1. Core Allocation Form Handler (Admin Only)
  const handleAllocate = (e) => {
    e.preventDefault();
    if (!isAdmin || isAllocated || !allocateTo) return;

    setAssets(assets.map(a => a.id === selectedAssetId ? {
      ...a,
      currentHolder: allocateTo,
      department: department,
      status: 'Allocated',
      expectedReturn: returnDate
    } : a));

    setHistoryLogs([
      { id: Date.now(), assetId: selectedAssetId, date: 'Today', message: `Allocated to ${allocateTo} - ${department || 'General'} (By Manager)` },
      ...historyLogs
    ]);

    setAllocateTo('');
    setDepartment('');
    setReturnDate('');
  };

  // 2. Transfer Request Submission (RBAC Enabled)
  const handleTransferRequest = (e) => {
    e.preventDefault();

    // If regular employee, they are requesting it for themselves
    const targetRecipient = isAdmin ? transferTo : currentUser;
    if (!targetRecipient || targetRecipient === currentAsset.currentHolder) return;

    const newRequest = {
      id: Date.now(),
      assetId: currentAsset.id,
      assetName: currentAsset.name,
      from: currentAsset.currentHolder,
      to: targetRecipient,
      requestedBy: isAdmin ? 'Asset Manager' : currentUser,
      reason: transferReason,
      status: 'Pending'
    };

    setTransferRequests([newRequest, ...transferRequests]);
    setTransferTo('');
    setTransferReason('');
  };

  // 3. Process Live Transfer Approvals (Admin Only)
  const approveTransfer = (req) => {
    if (!isAdmin) return;

    setAssets(assets.map(a => a.id === req.assetId ? {
      ...a,
      currentHolder: req.to,
      status: 'Allocated',
      expectedReturn: ''
    } : a));

    setTransferRequests(transferRequests.map(r => r.id === req.id ? { ...r, status: 'Approved' } : r));

    setHistoryLogs([
      { id: Date.now(), assetId: req.assetId, date: 'Today', message: `Transfer Approved: Moved from ${req.from} to ${req.to}` },
      ...historyLogs
    ]);
  };

  // 4. Asset Return Management Flow (Admin Only)
  const handleReturnAsset = () => {
    if (!isAdmin) return;

    setAssets(assets.map(a => a.id === selectedAssetId ? {
      ...a,
      currentHolder: '',
      department: '',
      status: 'Available',
      expectedReturn: ''
    } : a));

    setHistoryLogs([
      { id: Date.now(), assetId: selectedAssetId, date: 'Today', message: `Returned - condition: ${checkInCondition} | Notes: ${checkInNotes || 'None'}` },
      ...historyLogs
    ]);

    setCheckInNotes('');
  };

  return (
    <div className="p-8 bg-[#F8F9FC] min-h-screen text-slate-800">

      {/* --- RBAC ENVIRONMENT SIMULATOR BANNER --- */}
      <div className="mb-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔐</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">RBAC Environment Simulator</p>
            <p className="text-xs text-indigo-700">Toggle roles below to experience different interface screens natively.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white rounded-xl p-1 border border-indigo-200">
            <button
              onClick={() => setCurrentRole('Asset Manager')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isAdmin ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              💼 Manager / Dept Head
            </button>
            <button
              onClick={() => setCurrentRole('Employee')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!isAdmin ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-indigo-600'}`}
            >
              👤 Regular Employee
            </button>
          </div>
          {!isAdmin && (
            <select
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
              className="px-3 py-1.5 bg-white border border-indigo-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              {EMPLOYEES.map(emp => <option key={emp} value={emp}>As: {emp}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Header View Block */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Custody & Allocation Workspace</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isAdmin
            ? "Full administrative control view. Allocate stock items, handle asset check-ins, and authorize inter-department transfers."
            : "Employee self-service window. View asset tracking metrics or open custody request transfers."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Core Control Engine Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Main Context Configuration Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Asset Select Target</label>
            <select
              value={selectedAssetId}
              onChange={(e) => setSelectedAssetId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-medium"
            >
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.id} - {asset.name} ({asset.status}) {isOverdue(asset.expectedReturn) ? '⚠️ OVERDUE' : ''}
                </option>
              ))}
            </select>

            {currentAsset && isOverdue(currentAsset.expectedReturn) && currentAsset.status === 'Allocated' && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-center gap-2">
                ⏰ <strong>Overdue Flag Active:</strong> Expected back on {currentAsset.expectedReturn}.
              </div>
            )}
          </div>

          {/* DYNAMIC RBAC UI FORMS */}
          {isAdmin ? (
            /* =========================================================================
               MANAGER / DEPT HEAD VIEW PANEL
               ========================================================================= */
            <div className="space-y-6">
              {isAllocated ? (
                /* Admin view if already assigned */
                <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-6">
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                    <p className="text-sm font-bold text-rose-800">🔒 Allocation Locked to {currentAsset.currentHolder} ({currentAsset.department})</p>
                    <p className="text-xs text-rose-600 mt-1">Direct double allocations are blocked by database rules.</p>
                  </div>

                  {/* Admin Transfer Creation Override */}
                  <form onSubmit={handleTransferRequest} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Admin Custody Reallocation</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 font-semibold mb-1">Current Holder</label>
                        <input type="text" readOnly value={currentAsset.currentHolder} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 font-semibold mb-1">Move To Recipient</label>
                        <select
                          value={transferTo}
                          onChange={(e) => setTransferTo(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">Select Employee...</option>
                          {EMPLOYEES.filter(e => e !== currentAsset.currentHolder).map(emp => (
                            <option key={emp} value={emp}>{emp}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 font-semibold mb-1">Operational Audit Reason</label>
                      <input
                        type="text"
                        value={transferReason}
                        onChange={(e) => setTransferReason(e.target.value)}
                        placeholder="Admin reason for direct asset transfer..."
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                      Submit Admin Transfer
                    </button>
                  </form>

                  <hr className="border-slate-100" />

                  {/* Return Deck */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Process Return Check-In</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 font-semibold mb-1">Asset Condition Status</label>
                        <select
                          value={checkInCondition}
                          onChange={(e) => setCheckInCondition(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Excellent">Excellent</option>
                          <option value="Good">Good (Nominal)</option>
                          <option value="Damaged">Damaged / Needs Diagnostic</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 font-semibold mb-1">Log Notes</label>
                        <input
                          type="text"
                          value={checkInNotes}
                          onChange={(e) => setCheckInNotes(e.target.value)}
                          placeholder="Operational check notes..."
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <button type="button" onClick={handleReturnAsset} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
                      Process Immediate Return
                    </button>
                  </div>
                </div>
              ) : (
                /* Admin view if asset is available */
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">Assign Fresh Asset Target</h2>
                  <form onSubmit={handleAllocate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-500 font-semibold mb-1">Target Recipient</label>
                        <select
                          value={allocateTo}
                          onChange={(e) => setAllocateTo(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">Choose Employee...</option>
                          {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 font-semibold mb-1">Functional Department</label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">Select Department...</option>
                          {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 font-semibold mb-1">Expected Return Date</label>
                      <input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button type="submit" className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                      Commit Allocation Assignment
                    </button>
                  </form>
                </div>
              )}

              {/* MANAGER AUTHORIZATION MANAGEMENT MODULE */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h2 className="text-base font-bold text-slate-800 mb-2">Pending Authorization Pipeline</h2>
                <p className="text-xs text-slate-400 mb-4">Only Asset Managers and Department Heads possess signing keys to resolve these cards.</p>
                {transferRequests.filter(r => r.status === 'Pending').length === 0 ? (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">No incoming custody transfer requests currently awaiting your review.</p>
                ) : (
                  <div className="space-y-3">
                    {transferRequests.filter(r => r.status === 'Pending').map(req => (
                      <div key={req.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">📄 {req.assetId} ({req.assetName})</span>
                          <p className="text-sm font-medium text-slate-700 mt-1">Reallocate from <strong>{req.from}</strong> to <strong>{req.to}</strong></p>
                          <p className="text-xs text-slate-400 font-semibold">Initiated by: {req.requestedBy}</p>
                          <p className="text-xs text-slate-500 italic mt-1">"Reason: {req.reason}"</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => approveTransfer(req)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                        >
                          Approve & Authorize
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* =========================================================================
               REGULAR EMPLOYEE SELF-SERVICE VIEW PANEL
               ========================================================================= */
            <div className="space-y-6">
              {/* Asset Metrics Read Only Metadata Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h2 className="text-base font-bold text-slate-800 mb-3">Asset Custody Breakdown</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Current Status</p>
                    <p className={`text-sm font-bold mt-0.5 ${currentAsset?.status === 'Available' ? 'text-emerald-600' : 'text-amber-600'}`}>{currentAsset?.status}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Current Holder</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{currentAsset?.currentHolder || 'None (In Storage)'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl col-span-2 md:col-span-1">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Department Lock</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{currentAsset?.department || 'None'}</p>
                  </div>
                </div>
              </div>

              {/* EMPLOYEE WORKFLOW FORM ENTRY TRIGGER */}
              {isAllocated ? (
                currentAsset.currentHolder === currentUser ? (
                  <div className="bg-white p-6 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm text-center py-8">
                    <span className="text-2xl">💻</span>
                    <p className="text-sm font-bold text-slate-800 mt-2">You currently hold custody of this asset</p>
                    <p className="text-xs text-slate-500 mt-1">To turn in this equipment, please deliver it physically to the IT Admin depot desk.</p>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-800">Request Transfer Reallocation</h2>
                      <p className="text-xs text-slate-400 mt-0.5">This item is held by another user. Opening a file pipeline alerts the Manager queue.</p>
                    </div>

                    <form onSubmit={handleTransferRequest} className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <p className="text-slate-600"><strong>From:</strong> {currentAsset.currentHolder} ({currentAsset.department})</p>
                        <p className="text-slate-600"><strong>To (You):</strong> {currentUser}</p>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 font-semibold mb-1">State Business Justification</label>
                        <textarea
                          rows="3"
                          value={transferReason}
                          onChange={(e) => setTransferReason(e.target.value)}
                          placeholder="State why your project work metrics require this specific asset re-routed to your workspace..."
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
                        File Request Transfer Pipeline
                      </button>
                    </form>
                  </div>
                )
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 shadow-sm text-center py-8">
                  <span className="text-2xl">📦</span>
                  <p className="text-sm font-bold text-slate-800 mt-2">This asset is ready in Storage</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Employees cannot directly checkout storage gear. Please ping your Asset Manager or file an allocation desk ticket to claim this.</p>
                </div>
              )}

              {/* READ ONLY PIPELINE WATCHER CARD */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Your Request Watcher</h3>
                {transferRequests.filter(r => r.requestedBy === currentUser).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">You have no active pending transfer pipelines filed right now.</p>
                ) : (
                  <div className="space-y-2">
                    {transferRequests.filter(r => r.requestedBy === currentUser).map(req => (
                      <div key={req.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-700">{req.assetName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Target: {req.to} | Reason: "{req.reason}"</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* LOG HISTORY COMPARTMENT INDEX (Shared Sidebar) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Allocation History Log</h2>
          <div className="relative border-l border-slate-200 pl-4 space-y-5 ml-2">
            {historyLogs.filter(log => log.assetId === selectedAssetId).map(log => (
              <div key={log.id} className="text-xs relative">
                <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border border-white" />
                <span className="font-semibold text-indigo-600 block">{log.date}</span>
                <p className="text-slate-600 mt-0.5 font-medium">{log.message}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}