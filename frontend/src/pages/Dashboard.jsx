import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/api-client";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  function loadSummary() {
    setLoading(true);
    apiClient
      .get("/dashboard/summary")
      .then((data) => {
        setSummary(data);
        setError("");
      })
      .catch((err) => setError(err.message || "Failed to load dashboard."))
      .finally(() => setLoading(false));
  }

  if (loading) {
    return (
      <div className="p-8 min-h-screen flex items-center justify-center text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-600 rounded p-4">
          {error}
          <button
            onClick={loadSummary}
            className="ml-4 underline font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Available", count: summary.available },
    { label: "Allocated", count: summary.allocated },
    { label: "Maintenance Today", count: summary.maintenanceToday },
    { label: "Active Bookings", count: summary.activeBookings },
    { label: "Pending Transfers", count: summary.pendingTransfers },
    { label: "Upcoming Returns", count: summary.upcomingReturns },
  ];

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Command Center</h1>
        <p className="text-slate-500 mt-1 text-sm">Real-time telemetry overview of operational assets.</p>
      </div>

      {summary.overdue?.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-300 text-red-700 rounded-xl p-4">
          <p className="font-semibold text-sm">
            {summary.overdue.length} item(s) overdue for return
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {kpis.map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
          >
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {stat.label}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">{stat.count}</h3>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mb-8">
        <Link
          to="/assets"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Register Asset
        </Link>
        <Link
          to="/booking"
          className="bg-white border px-4 py-2 rounded-lg text-sm font-medium"
        >
          Book Resource
        </Link>
        <Link
          to="/maintenance"
          className="bg-white border px-4 py-2 rounded-lg text-sm font-medium"
        >
          Raise Request
        </Link>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h2>
        {summary.recentActivity?.length ? (
          <ul className="space-y-2">
            {summary.recentActivity.map((item, i) => (
              <li key={item.id || i} className="text-sm text-slate-600 border-b last:border-0 pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-800">{item.action}</p>
                    <p className="text-xs text-slate-500">
                      {item.entityType} {item.entityId}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No recent activity yet.</p>
        )}
      </div>
    </div>
  );
}
