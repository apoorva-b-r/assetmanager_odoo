import React, { useState } from 'react';

// Structured operational datasets reflecting the values layout in your wireframe sketch
const DEPARTMENT_UTILIZATION = [
  { dept: 'Engineering', percentage: 88, rawCount: 142 },
  { dept: 'Operations', percentage: 76, rawCount: 98 },
  { dept: 'Product Design', percentage: 94, rawCount: 45 },
  { dept: 'Marketing', percentage: 62, rawCount: 38 },
  { dept: 'HR & Legal', percentage: 41, rawCount: 22 },
  { dept: 'Sales Support', percentage: 79, rawCount: 61 },
];

const MAINTENANCE_FREQUENCY = [
  { category: 'Heavy Machinery (Forklifts)', averagePerYear: 5.4, trend: 'Increasing' },
  { category: 'Fleet Vehicles (Vans)', averagePerYear: 4.2, trend: 'Stable' },
  { category: 'AV Equipment (Projectors)', averagePerYear: 2.8, trend: 'Decreasing' },
  { category: 'Computing Hardware', averagePerYear: 1.1, trend: 'Stable' },
  { category: 'Office Ergonomic Furniture', averagePerYear: 0.4, trend: 'Stable' },
];

const MOST_USED_ASSETS = [
  { target: 'Conference Room B2', metric: '34 bookings this month', type: 'Spatial Resource' },
  { target: 'Delivery Van AF-343', metric: '21 logistics trips this month', type: 'Fleet Vehicle' },
  { target: '4K Laser Projector AF-335', metric: '18 high-use sessions', type: 'AV Device' },
];

const IDLE_ASSETS = [
  { target: 'DSLR Camera AF-0301', metric: 'Unused 60+ consecutive days', action: ' Flag for Redistribution' },
  { target: 'Task Chair AF-0410', metric: 'Unused 45 days in buffer hub', action: 'Move to Storage' },
  { target: 'Workstation Node AF-1190', metric: 'Unused 38 days in Dev Lab', action: 'Audit Allocation' },
];

const LIFECYCLE_ALERTS = [
  { id: 'AF-0087', name: 'Logistics Forklift', reason: 'Preventative service interval deadline due in 5 days', tier: 'Urgent Maintenance' },
  { id: 'AF-0020', name: 'Developer Laptop Array', reason: '4 years operational age reached: nearing mandatory retirement framework', tier: 'Lifecycle Review' },
  { id: 'AF-0932', name: 'Server Rack Air handler', reason: 'Efficiency coefficient degradation detected: filter lifecycle at 92%', tier: 'Routine Check' },
];

export default function ReportsAnalyticsWorkspace() {
  const [selectedFormat, setSelectedFormat] = useState('CSV Spreadsheet');
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Simulation handler for report compilation generation
  const handleTriggerExport = (e) => {
    e.preventDefault();
    setExporting(true);
    setExportSuccess(false);

    setTimeout(() => {
      setExporting(false);
      setExportSuccess(true);
      // Automatically clear confirmation badge after delay interval window
      setTimeout(() => setExportSuccess(false), 4000);
    }, 1500);
  };

  return (
    <div className="p-8 bg-[#F8F9FC] min-h-screen text-slate-800 font-sans">

      {/* Header Module */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reports & Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Review operational capacity performance metrics, utilization trends, and structural inventory alerts.</p>
      </div>

      {/* Main Structural Layout Grid */}
      <div className="space-y-8">

        {/* ROW 1: Visual Metric Charts (Department Utilization Bar Graph + Maintenance Trends Line List) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Chart Component A: Utilization by Department Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">Utilization By Department</h3>
              <p className="text-xs text-slate-500 mt-0.5">Total capacity index of physical allocation groups actively deployed in workflows.</p>
            </div>

            {/* Micro-bar chart layout mapping your wireframe sketch blueprint */}
            <div className="flex items-end justify-between h-48 pt-4 px-2 border-b border-slate-200">
              {DEPARTMENT_UTILIZATION.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 group px-1">
                  {/* Tooltip dynamic hover tag structure layout component */}
                  <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                    {item.percentage}%
                  </span>

                  {/* Core Bar Pillar */}
                  <div
                    style={{ height: `${item.percentage}%` }}
                    className="w-full bg-slate-800 rounded-t-lg group-hover:bg-indigo-600 transition-all duration-500 shadow-xs relative"
                  >
                    <div className="absolute inset-x-0 top-0 h-1/3 bg-white/10 rounded-t-lg" />
                  </div>

                  {/* Footer Meta Description Label */}
                  <span className="text-[10px] font-bold text-slate-400 mt-2 truncate max-w-[65px] text-center" title={item.dept}>
                    {item.dept}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
              <span>Index Range: 0% - 100% Allocation Max</span>
              <span className="text-slate-600 font-bold">Peak Segment: Product Design</span>
            </div>
          </div>

          {/* Chart Component B: Maintenance Frequency Breakdown */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-400">Maintenance Frequency Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">Average yearly maintenance interventions tracked relative to historical category trends.</p>
            </div>

            <div className="divide-y divide-slate-100 flex-1 flex flex-col justify-center">
              {MAINTENANCE_FREQUENCY.map((item, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800">{item.category}</p>
                    <p className="text-[11px] text-slate-400">System Performance Vector: <span className="font-medium text-slate-600">{item.trend}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Visual miniature inline frequency gauge progress line tracker bar */}
                    <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden hidden sm:block border border-slate-200/40">
                      <div
                        style={{ width: `${(item.averagePerYear / 6) * 100}%` }}
                        className={`h-full rounded-full ${item.averagePerYear > 4 ? 'bg-rose-500' : item.averagePerYear > 2 ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                      />
                    </div>
                    <span className="font-mono font-black text-slate-900 text-right min-w-[70px] bg-slate-50 px-2 py-0.5 border border-slate-200 rounded text-[11px]">
                      {item.averagePerYear}x / yr
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ROW 2: Activity Delta Tracking Modules (Most-Used Assets vs. Idle Assets Ledger Blocks) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Block Section A: Most Used Assets Tracker */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">🔥 High-Utilization / Most Used Assets</h3>
              <p className="text-xs text-slate-400">Top operational objects logging maximum operational booking cycle times this month.</p>
            </div>

            <div className="space-y-3">
              {MOST_USED_ASSETS.map((asset, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">{asset.type}</span>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">{asset.target}</h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-right">
                    📈 {asset.metric}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Block Section B: Idle Assets Hub Triage */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">💤 Under-Utilization / Idle Assets</h3>
              <p className="text-xs text-slate-400">Items retaining zero checkout transaction actions within standard observation buffer windows.</p>
            </div>

            <div className="space-y-3">
              {IDLE_ASSETS.map((asset, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{asset.target}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Status: <span className="text-rose-600 font-semibold">{asset.metric}</span></p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-2xs text-right whitespace-nowrap">
                    ⚙️ {asset.action}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ROW 3: Lifecycle Threshold Flags Alert Bar Strip */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">⚠️ Assets Due for Maintenance / Nearing Retirement</h3>
            <p className="text-xs text-slate-400">Automated structural triggers flagging immediate service schedules or asset depreciation swap limits.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LIFECYCLE_ALERTS.map((alert, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded">{alert.id}</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wide ${alert.tier === 'Urgent Maintenance' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>{alert.tier}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-2">{alert.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{alert.reason}</p>
                </div>

                <button type="button" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 text-left pt-1 transition-colors">
                  Open Control Asset Master →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ROW 4: Action Export Compilation Strip Module */}
        <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-0.5 text-center sm:text-left">
            <h3 className="text-sm font-bold text-white">Generate Structured System Export Ledger</h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Compiles active inventory snapshots, maintenance cycles logs, and operational velocity trends metrics into a single compliance archive.
            </p>
          </div>

          <form onSubmit={handleTriggerExport} className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="text-xs font-bold text-slate-200 bg-slate-800 border border-slate-700 p-2 rounded-xl focus:outline-none"
            >
              <option value="CSV Spreadsheet">Excel / CSV Spreadsheet (.csv)</option>
              <option value="Audit Compliant PDF">Audit Compliant PDF (.pdf)</option>
              <option value="Structured JSON Record">Structured JSON Record (.json)</option>
            </select>

            <button
              type="submit"
              disabled={exporting}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shadow-sm min-w-[130px] text-center ${exporting
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
            >
              {exporting ? 'Compiling Ledger...' : 'Export Report'}
            </button>
          </form>
        </div>

        {/* Simulated Download Notification Alert Toast Box */}
        {exportSuccess && (
          <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl border border-emerald-500/30 flex items-center gap-3 animate-slide-in z-50 text-xs font-semibold">
            <span>🚀</span>
            <div>
              <p className="font-bold">System Manifest Exported Successfully</p>
              <p className="text-[11px] text-emerald-100 mt-0.5">Data compiled natively in {selectedFormat} structure format.</p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}