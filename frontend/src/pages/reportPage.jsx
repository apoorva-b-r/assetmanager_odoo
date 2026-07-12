import { useEffect, useState } from "react";
import { apiClient } from "../lib/api-client";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 to 20:00

// 1. UTILIZATION BY DEPARTMENT — BAR CHART
function DepartmentBarChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-400 italic text-center py-20">No utilization data available.</p>;
  }

  const width = 500;
  const height = 300;
  const paddingLeft = 40;
  const paddingBottom = 40;
  const paddingTop = 25;
  const paddingRight = 20;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.totalAllocations), 1);
  const barWidth = Math.min(45, (chartWidth / data.length) - 16);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Y Axis Grid Lines & Labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = paddingTop + chartHeight * (1 - ratio);
        const val = Math.round(maxVal * ratio);
        return (
          <g key={ratio} className="text-[10px] fill-slate-400 font-medium">
            <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={paddingLeft - 8} y={y + 4} textAnchor="end">{val}</text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((item, idx) => {
        const x = paddingLeft + (idx * (chartWidth / data.length)) + (chartWidth / data.length / 2) - (barWidth / 2);
        const barHeight = (item.totalAllocations / maxVal) * chartHeight;
        const y = paddingTop + chartHeight - barHeight;

        return (
          <g key={item.departmentId} className="group">
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill="#3b82f6"
              rx={4}
              className="hover:fill-blue-700 transition-colors cursor-pointer"
            />
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              className="text-[9px] font-bold fill-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {item.totalAllocations}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - 20}
              textAnchor="middle"
              className="text-[9px] font-semibold fill-slate-500"
            >
              {item.departmentName.slice(0, 8)}
            </text>
          </g>
        );
      })}
      {/* Bottom axis line */}
      <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#e2e8f0" strokeWidth={1} />
    </svg>
  );
}

// 2. MAINTENANCE FREQUENCY — LINE CHART
function MaintenanceLineChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-400 italic text-center py-20">No maintenance trend data available.</p>;
  }

  const width = 500;
  const height = 300;
  const paddingLeft = 40;
  const paddingBottom = 40;
  const paddingTop = 25;
  const paddingRight = 20;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.count), 1);

  // Build line path
  const points = data.map((item, idx) => {
    const x = paddingLeft + (idx * (chartWidth / (data.length - 1 || 1)));
    const y = paddingTop + chartHeight - ((item.count / maxVal) * chartHeight);
    return { x, y, name: item.name, count: item.count };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const y = paddingTop + chartHeight * (1 - ratio);
        const val = Math.round(maxVal * ratio);
        return (
          <g key={ratio} className="text-[10px] fill-slate-400 font-medium">
            <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={paddingLeft - 8} y={y + 4} textAnchor="end">{val}</text>
          </g>
        );
      })}

      {/* Line Path */}
      {points.length > 0 && (
        <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Dots */}
      {points.map((p, idx) => (
        <g key={idx} className="group">
          <circle
            cx={p.x}
            cy={p.y}
            r={5}
            fill="#f59e0b"
            stroke="#fff"
            strokeWidth={2}
            className="hover:r-7 transition-all cursor-pointer"
          />
          <text
            x={p.x}
            y={p.y - 10}
            textAnchor="middle"
            className="text-[9px] font-bold fill-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {p.count}
          </text>
          <text
            x={p.x}
            y={height - 20}
            textAnchor="middle"
            className="text-[9px] font-semibold fill-slate-500"
          >
            {p.name}
          </text>
        </g>
      ))}

      {/* Bottom axis line */}
      <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="#e2e8f0" strokeWidth={1} />
    </svg>
  );
}

// 3. DEPARTMENT-WISE ALLOCATION — DONUT CHART
function DepartmentDonutChart({ data }) {
  const validData = data.filter(d => d.allocationCount > 0);
  if (validData.length === 0) {
    return <p className="text-sm text-slate-400 italic text-center py-20">No active allocations recorded.</p>;
  }

  const total = validData.reduce((acc, d) => acc + d.allocationCount, 0);
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
      <svg width="180" height="180" viewBox="0 0 200 200" className="flex-shrink-0">
        {validData.map((item, idx) => {
          const percent = item.allocationCount / total;
          const strokeDasharray = `${percent * 2 * Math.PI * 60} ${2 * Math.PI * 60}`;
          const strokeDashoffset = `${-accumulatedPercent * 2 * Math.PI * 60}`;
          accumulatedPercent += percent;

          return (
            <circle
              key={item.departmentId}
              cx="100"
              cy="100"
              r="60"
              fill="transparent"
              stroke={colors[idx % colors.length]}
              strokeWidth="22"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 100 100)"
              className="hover:opacity-90 transition-opacity cursor-pointer"
              title={`${item.departmentName}: ${item.allocationCount} checkouts`}
            />
          );
        })}
        <circle cx="100" cy="100" r="48" fill="#fff" />
        <text x="100" y="105" textAnchor="middle" className="text-xs font-bold fill-slate-700">
          {total} Active
        </text>
      </svg>

      <div className="space-y-2 text-xs text-slate-600 font-semibold self-start sm:self-center">
        {validData.map((item, idx) => (
          <div key={item.departmentId} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded" style={{ backgroundColor: colors[idx % colors.length] }} />
            <span>{item.departmentName}: <span className="font-bold text-slate-900">{item.allocationCount}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportPage() {
  const [summary, setSummary] = useState(null);
  const [utilization, setUtilization] = useState([]);
  const [maintenanceTrend, setMaintenanceTrend] = useState([]);
  const [mostUsed, setMostUsed] = useState([]);
  const [idleAssets, setIdleAssets] = useState([]);
  const [attentionAssets, setAttentionAssets] = useState([]);
  const [deptAllocation, setDeptAllocation] = useState([]);
  const [bookingHeatmap, setBookingHeatmap] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    setError("");
    try {
      const [sumData, utilData, trendData, mostUsedData, idleData, attentionData, deptAllocData, heatmapData] = await Promise.all([
        apiClient.get("/reports/summary").catch(() => null),
        apiClient.get("/reports/utilization").catch(() => []),
        apiClient.get("/reports/maintenance-trend").catch(() => []),
        apiClient.get("/reports/most-used").catch(() => []),
        apiClient.get("/reports/idle").catch(() => []),
        apiClient.get("/reports/requiring-attention").catch(() => []),
        apiClient.get("/reports/department-allocation").catch(() => []),
        apiClient.get("/reports/booking-heatmap").catch(() => []),
      ]);

      setSummary(sumData);
      setUtilization(utilData);
      setMaintenanceTrend(trendData);
      setMostUsed(mostUsedData);
      setIdleAssets(idleData);
      setAttentionAssets(attentionData);
      setDeptAllocation(deptAllocData);
      setBookingHeatmap(heatmapData);
    } catch (err) {
      setError(err.message || "Failed to load report analytics.");
    } finally {
      setLoading(false);
    }
  }

  // Export report helper
  function exportCSV(filename, headers, dataRows) {
    const csvContent = [
      headers.join(","),
      ...dataRows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleExportAll() {
    if (!summary) return;
    const headers = ["Metric Name", "Value"];
    const rows = [
      ["Total Assets", summary.totalAssets],
      ["Currently Allocated", summary.allocatedAssets],
      ["Available Assets", summary.availableAssets],
      ["Under Maintenance", summary.underMaintenanceAssets],
      ["Active Bookings", summary.activeBookings],
      ["Open Maintenance Requests", summary.openMaintenanceRequests],
    ];
    exportCSV("executive_summary.csv", headers, rows);
  }

  if (loading) {
    return <div className="p-8 text-slate-500">Loading analytics dashboard...</div>;
  }

  return (
    <div className="p-4 md:p-8 min-h-screen space-y-8">
      {/* Header and Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Telemetry & Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Live operational intelligence gathered directly from database audits.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportAll}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Export CSV Report
          </button>
          <button
            onClick={loadReports}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Cards Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total Assets", val: summary.totalAssets, color: "text-slate-900" },
            { label: "Allocated", val: summary.allocatedAssets, color: "text-blue-600" },
            { label: "Available", val: summary.availableAssets, color: "text-emerald-600" },
            { label: "In Service", val: summary.underMaintenanceAssets, color: "text-amber-600" },
            { label: "Active Bookings", val: summary.activeBookings, color: "text-indigo-600" },
            { label: "Pending Service", val: summary.openMaintenanceRequests, color: "text-rose-600" },
          ].map((card) => (
            <div key={card.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{card.label}</span>
              <h3 className={`text-2xl font-bold mt-2 ${card.color}`}>{card.val}</h3>
            </div>
          ))}
        </div>
      )}

      {/* TOP ROW: Two Large Side-by-Side Graphical Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* BAR CHART: Utilization */}
        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Utilization by Department</h2>
            <p className="text-xs text-slate-400">Total checkouts scoped per organizational unit.</p>
          </div>
          <div className="w-full">
            <DepartmentBarChart data={utilization} />
          </div>
        </section>

        {/* LINE CHART: Maintenance Frequency Trend */}
        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Maintenance Frequency</h2>
            <p className="text-xs text-slate-400">Monthly breakdown trend of logged service tickets.</p>
          </div>
          <div className="w-full">
            <MaintenanceLineChart data={maintenanceTrend} />
          </div>
        </section>
      </div>

      {/* MIDDLE ROW: Ranked Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* D. Most Used Assets */}
        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Most Used Assets</h2>
            <p className="text-xs text-slate-400">Top assets ranked by historical checkouts.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-bold">
                <tr>
                  <th className="px-4 py-2">Tag</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2 text-right">Allocations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mostUsed.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">No usage history found.</td>
                  </tr>
                ) : (
                  mostUsed.map((asset) => (
                    <tr key={asset.id} className="text-slate-700 hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">{asset.tag}</td>
                      <td className="px-4 py-2.5 font-medium">{asset.name}</td>
                      <td className="px-4 py-2.5 text-slate-500">{asset.categoryName}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-blue-600">{asset.usageCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* E. Idle Assets */}
        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Idle Assets</h2>
            <p className="text-xs text-slate-400">Inventory assets with zero historical checkouts.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-bold">
                <tr>
                  <th className="px-4 py-2">Tag</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2 text-right">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {idleAssets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400 italic">No idle assets found in scope.</td>
                  </tr>
                ) : (
                  idleAssets.map((asset) => (
                    <tr key={asset.id} className="text-slate-700 hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">{asset.tag}</td>
                      <td className="px-4 py-2.5 font-medium">{asset.name}</td>
                      <td className="px-4 py-2.5 text-slate-500">{asset.categoryName}</td>
                      <td className="px-4 py-2.5 text-right text-slate-500">{new Date(asset.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* LOWER ROW: Donut Allocation & Heatmap Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Donut Chart: Department Allocation */}
        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-1">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Department Allocation</h2>
            <p className="text-xs text-slate-400">Distribution of active allocations.</p>
          </div>
          <div className="w-full">
            <DepartmentDonutChart data={deptAllocation} />
          </div>
        </section>

        {/* Heatmap Grid: Booking Frequency */}
        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Booking Heatmap</h2>
            <p className="text-xs text-slate-400">Weekly non-cancelled reservations density by hour grid window.</p>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="min-w-[550px] border border-slate-100 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[80px_1fr] bg-slate-50 border-b border-slate-100 text-center font-bold text-[9px] text-slate-400 uppercase">
                <div className="p-2.5 border-r border-slate-100">Day</div>
                <div className="grid grid-cols-13">
                  {HOURS.map((hour) => (
                    <div key={hour} className="p-2.5 border-r border-slate-100 last:border-r-0">
                      {String(hour).padStart(2, "0")}
                    </div>
                  ))}
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {DAYS_OF_WEEK.map((dayName, dayIdx) => (
                  <div key={dayName} className="grid grid-cols-[80px_1fr] items-center text-[11px] font-semibold">
                    <div className="p-2.5 bg-slate-50/50 border-r border-slate-100 text-slate-700">{dayName.slice(0, 3)}</div>
                    <div className="grid grid-cols-13 h-full">
                      {HOURS.map((hour) => {
                        const cell = bookingHeatmap.find((c) => c.day === dayIdx && c.hour === hour);
                        const count = cell ? cell.count : 0;

                        let cellColor = "bg-white hover:bg-slate-50/50";
                        if (count > 0 && count <= 2) cellColor = "bg-blue-50 text-blue-900 hover:bg-blue-100/50";
                        if (count > 2 && count <= 5) cellColor = "bg-blue-200 text-blue-950 hover:bg-blue-300/50";
                        if (count > 5) cellColor = "bg-blue-600 text-white hover:bg-blue-700";

                        return (
                          <div
                            key={hour}
                            title={`${dayName} at ${hour}:00 - ${count} bookings`}
                            className={`flex items-center justify-center border-r border-slate-100 last:border-r-0 h-9 transition-colors text-[9px] cursor-help ${cellColor}`}
                          >
                            {count > 0 ? count : ""}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER ROW: Requiring Attention */}
      <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Assets Requiring Attention</h2>
          <p className="text-xs text-slate-400">Assets currently undergoing repairs or flagged with high incident logs.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-bold">
              <tr>
                <th className="px-4 py-2">Tag</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Condition</th>
                <th className="px-4 py-2 text-right">Service Incident Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attentionAssets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400 italic">No assets require immediate attention.</td>
                </tr>
              ) : (
                attentionAssets.map((asset) => (
                  <tr key={asset.id} className="text-slate-700 hover:bg-slate-50/50">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{asset.tag}</td>
                    <td className="px-4 py-2.5 font-medium">{asset.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        asset.status === "UNDER_MAINTENANCE" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 font-semibold">{asset.condition}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-rose-600">{asset.maintenanceCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
