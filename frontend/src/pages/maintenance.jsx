import React from 'react';

export default function Maintenance() {
  const tasks = [
    { id: 'M-401', item: 'Testing Server Rack 2', issue: 'Overheating in fan section 4B', priority: 'Critical', stage: 'In Progress' },
    { id: 'M-402', item: 'Company Projector Max', issue: 'Bulb lumen decay below baseline', priority: 'Low', stage: 'Backlog' },
  ];

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Maintenance Pipeline</h1>
        <p className="text-slate-500 mt-1 text-sm">Track lifecycle equipment diagnostics, down-times, and rapid field patching workflows.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Backlog', 'In Progress', 'Resolved'].map(stage => (
          <div key={stage} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 min-h-[400px]">
            <h3 className="font-bold text-slate-700 text-sm mb-4 px-2 uppercase tracking-wider flex items-center justify-between">
              <span>{stage}</span>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md">
                {tasks.filter(t => t.stage === stage).length}
              </span>
            </h3>

            <div className="space-y-3">
              {tasks.filter(t => t.stage === stage).map(task => (
                <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-indigo-600 font-bold">{task.id}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${task.priority === 'Critical' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                      }`}>{task.priority}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800">{task.item}</h4>
                  <p className="text-xs text-slate-500 mt-1">{task.issue}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}