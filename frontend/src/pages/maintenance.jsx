import React, { useState } from 'react';

const INITIAL_TICKETS = [
  { id: 'AF-0062', name: 'Projector', issue: 'Projector bulb not turning on', priority: 'High', stage: 'Pending', technician: '', history: ['Ticket raised by Operations'] },
  { id: 'AF-0003', name: 'AC Unit', issue: 'AC unit noisy compressor', priority: 'Medium', stage: 'Approved', technician: '', history: ['Ticket raised', 'Approved by Asset Manager'] },
  { id: 'AF-0078', name: 'Forklift', issue: 'Hydraulic leak under chassis', priority: 'Critical', stage: 'Technician Assigned', technician: 'R. Varma', history: ['Ticket raised', 'Approved', 'Assigned to R. Varma'] },
  { id: 'AF-0897', name: 'Printer', issue: 'Printer Jam - rollers sticking', priority: 'Low', stage: 'In Progress', technician: 'S. Jenkins', history: ['Ticket raised', 'Approved', 'Assigned', 'Repair in progress'] },
  { id: 'AF-0873', name: 'Ergonomic Chair', issue: 'Chair repair - hydraulic cylinder', priority: 'Low', stage: 'Resolved', technician: 'P. Team', history: ['Ticket raised', 'Approved', 'Assigned', 'In Progress', 'Resolved on 7 Jul'] },
];

const AVAILABLE_ASSETS = [
  { id: 'AF-1044', name: 'Conference Room Display' },
  { id: 'AF-3302', name: 'Logitech MeetUp Cam' }
];

const STAGES = ['Pending', 'Approved', 'Technician Assigned', 'In Progress', 'Resolved'];

export default function MaintenanceManagement() {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [assets, setAssets] = useState(AVAILABLE_ASSETS);
  const [currentRole, setCurrentRole] = useState('Asset Manager');

  // Form & Interaction States
  const [selectedAssetIdx, setSelectedAssetIdx] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [activeHistoryTicket, setActiveHistoryTicket] = useState(null);

  // Interactive Dropdown fields for assignment simulation
  const [selectedTechs, setSelectedTechs] = useState({});

  // Raise fresh request
  const handleRaiseRequest = (e) => {
    e.preventDefault();
    if (!selectedAssetIdx) return;

    const chosenAsset = assets[Number(selectedAssetIdx)];
    const newTicket = {
      id: chosenAsset.id,
      name: chosenAsset.name,
      issue: issueDescription,
      priority: priority,
      stage: 'Pending',
      technician: '',
      history: [`Issue flagged by staff: "${issueDescription}"`]
    };

    setTickets([...tickets, newTicket]);
    setAssets(assets.filter((_, idx) => idx !== Number(selectedAssetIdx)));
    setSelectedAssetIdx('');
    setIssueDescription('');
  };

  // RBAC Manager Action: Approve Ticket
  const handleApproveTicket = (ticketId) => {
    if (currentRole !== 'Asset Manager') return;
    setTickets(tickets.map(t => t.id === ticketId ? {
      ...t,
      stage: 'Approved',
      history: [...t.history, 'Approved by Asset Manager. Asset status locked to "Under Maintenance"']
    } : t));
  };

  // RBAC Manager Action: Deny Ticket
  const handleRejectTicket = (ticketId) => {
    if (currentRole !== 'Asset Manager') return;
    setTickets(tickets.map(t => t.id === ticketId ? {
      ...t,
      stage: 'Resolved',
      history: [...t.history, 'Rejected and archived by Asset Manager.']
    } : t));
  };

  // Dispatch Action: Assigning a technician moves it instantly to "Technician Assigned"
  const handleAssignTechnician = (ticketId, techName) => {
    if (!techName) return;
    setTickets(tickets.map(t => t.id === ticketId ? {
      ...t,
      technician: techName,
      stage: 'Technician Assigned',
      history: [...t.history, `Technician (${techName}) assigned to ticket.`]
    } : t));
  };

  // Technician Action: Start Work moves it instantly to "In Progress"
  const handleStartWork = (ticketId) => {
    setTickets(tickets.map(t => t.id === ticketId ? {
      ...t,
      stage: 'In Progress',
      history: [...t.history, 'Technician checked in. Repair work initialized.']
    } : t));
  };

  // Technician Action: Complete Task moves it instantly to "Resolved"
  const handleCompleteTask = (ticketId) => {
    setTickets(tickets.map(t => t.id === ticketId ? {
      ...t,
      stage: 'Resolved',
      history: [...t.history, 'Repair completed successfully. Asset returned to "Available" status.']
    } : t));
  };

  return (
    <div className="p-8 bg-[#F8F9FC] min-h-screen text-slate-800 font-sans">

      {/* RBAC Role Selector Banner */}
      <div className="mb-6 p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">Security / RBAC Simulator Context:</p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
          {['Employee', 'Asset Manager'].map(role => (
            <button
              key={role}
              onClick={() => setCurrentRole(role)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currentRole === role ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Maintenance Board</h1>
        <p className="text-sm text-slate-500 mt-1">Operational repair tasks trigger automated column transitions upon execution.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">

        {/* Intake Request Form Side Desk */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Raise Request</h2>
            <p className="text-xs text-slate-400">Open to all authenticated staff roles.</p>
          </div>

          <form onSubmit={handleRaiseRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Select Asset</label>
              <select
                value={selectedAssetIdx}
                onChange={(e) => setSelectedAssetIdx(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="">Choose item...</option>
                {assets.map((asset, idx) => (
                  <option key={asset.id} value={idx}>{asset.id} - {asset.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Describe Issue</label>
              <textarea
                rows="3"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="What seems to be broken?"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {['Low', 'Medium', 'High'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${priority === p ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all">
              Submit Request
            </button>
          </form>
        </div>

        {/* 5-Column Automated Kanban Matrix Workspace */}
        <div className="xl:col-span-3 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[950px]">
            {STAGES.map(stage => {
              const stageTickets = tickets.filter(t => t.stage === stage);
              return (
                <div key={stage} className="flex-1 bg-slate-100/80 rounded-2xl p-3 border border-slate-200/60 flex flex-col min-h-[580px]">

                  {/* Column Label */}
                  <div className="mb-4 flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">{stage}</span>
                    <span className="bg-slate-200 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {stageTickets.length}
                    </span>
                  </div>

                  {/* Cards Interface Stack */}
                  <div className="space-y-3 flex-1">
                    {stageTickets.map(ticket => {
                      const isManager = currentRole === 'Asset Manager';

                      return (
                        <div
                          key={ticket.id}
                          className={`p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between min-h-[160px] transition-all hover:shadow-md ${ticket.stage === 'Resolved' ? 'border-l-4 border-l-emerald-500 bg-emerald-50/10' : ''
                            }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                {ticket.id}
                              </span>
                              <span className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${ticket.priority === 'High' || ticket.priority === 'Critical' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                  ticket.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-50 text-slate-600 border border-slate-100'
                                }`}>
                                {ticket.priority}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-slate-900 mt-2.5">{ticket.name}</h4>
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                              {ticket.issue}
                            </p>

                            {ticket.technician && (
                              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 w-max font-medium">
                                <span>🔧 Tech:</span>
                                <span className="text-slate-800 font-bold">{ticket.technician}</span>
                              </div>
                            )}
                          </div>

                          {/* Contextual Action Blocks replace generic "Advance" buttons */}
                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">

                            {/* LANE 1 ACTIONS: PENDING */}
                            {stage === 'Pending' && (
                              <div className="flex gap-1.5 w-full justify-end">
                                {isManager ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectTicket(ticket.id)}
                                      className="text-[10px] px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-md border border-rose-100 transition-colors flex-1"
                                    >
                                      Deny
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveTicket(ticket.id)}
                                      className="text-[10px] px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md transition-all text-center flex-1"
                                    >
                                      Approve ✓
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[10px] text-center w-full font-bold text-amber-600 bg-amber-50/50 py-1 rounded-md border border-amber-100/60 block">
                                    🔒 Manager Review Required
                                  </span>
                                )}
                              </div>
                            )}

                            {/* LANE 2 ACTIONS: APPROVED */}
                            {stage === 'Approved' && (
                              <div className="flex flex-col gap-1 w-full">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Assign Crew to Dispatch</label>
                                <select
                                  value={selectedTechs[ticket.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedTechs({ ...selectedTechs, [ticket.id]: val });
                                    handleAssignTechnician(ticket.id, val);
                                  }}
                                  className="w-full text-[11px] p-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 font-medium"
                                >
                                  <option value="">Select Technician...</option>
                                  <option value="R. Varma">R. Varma (Hardware)</option>
                                  <option value="S. Jenkins">S. Jenkins (Facilities)</option>
                                  <option value="A. Diaz">A. Diaz (IT Core)</option>
                                </select>
                              </div>
                            )}

                            {/* LANE 3 ACTIONS: TECHNICIAN ASSIGNED */}
                            {stage === 'Technician Assigned' && (
                              <button
                                type="button"
                                onClick={() => handleStartWork(ticket.id)}
                                className="w-full text-center text-[10px] font-bold bg-slate-900 hover:bg-indigo-600 text-white py-1.5 rounded-md transition-all"
                              >
                                Check In & Start Repair →
                              </button>
                            )}

                            {/* LANE 4 ACTIONS: IN PROGRESS */}
                            {stage === 'In Progress' && (
                              <button
                                type="button"
                                onClick={() => handleCompleteTask(ticket.id)}
                                className="w-full text-center text-[10px] font-bold bg-indigo-600 hover:bg-emerald-600 text-white py-1.5 rounded-md transition-all shadow-xs"
                              >
                                Mark Task Resolved ✓
                              </button>
                            )}

                            {/* UTILITY BAR: HISTORY TOGGLE */}
                            <div className="flex items-center justify-between text-[10px] pt-1">
                              <button
                                type="button"
                                onClick={() => setActiveHistoryTicket(ticket)}
                                className="font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1"
                              >
                                📜 View Lifecycle Audit History
                              </button>
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Lifecycle Audit Log Modal Popover */}
      {activeHistoryTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-100 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md">{activeHistoryTicket.id}</span>
                <h3 className="text-base font-bold text-slate-900 mt-2">{activeHistoryTicket.name} Maintenance Trail</h3>
              </div>
              <button onClick={() => setActiveHistoryTicket(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1">×</button>
            </div>

            <div className="space-y-3 border-l-2 border-indigo-100 pl-4 py-1">
              {activeHistoryTicket.history.map((log, index) => (
                <div key={index} className="text-xs relative">
                  <span className="absolute -left-[21.5px] top-1 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-white" />
                  <p className="text-slate-600 font-medium">{log}</p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 border border-slate-100 leading-normal">
                <strong>State-Flow Integrity:</strong> Moving past pending updates state to <code>Under Maintenance</code>, lock-blocking checkouts automatically.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}