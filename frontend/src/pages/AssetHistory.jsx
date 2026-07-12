import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiClient } from "../lib/api-client";

export default function AssetHistory() {
  const { id } = useParams();
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState({ allocations: [], maintenance: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHistory();
  }, [id]);

  async function loadHistory() {
    setLoading(true);
    setError("");

    try {
      const [assetData, historyData] = await Promise.all([
        apiClient.get(`/assets/${id}`),
        apiClient.get(`/assets/${id}/history`),
      ]);

      setAsset(assetData);
      setHistory(historyData);
    } catch (err) {
      setError(err.message || "Failed to load asset history.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500">Loading asset history...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            <Link to="/assets" className="text-indigo-600 hover:underline">
              Assets
            </Link>{" "}
            / History
          </p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {asset?.name || "Asset History"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {asset?.tag ? `Tag ${asset.tag}` : "Allocation and maintenance timeline"}
          </p>
        </div>
        <Link
          to="/assets"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          Back to assets
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Allocation History</h2>
          <div className="space-y-3">
            {history.allocations.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing here yet.</p>
            ) : (
              history.allocations.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{entry.status}</p>
                      <p className="text-slate-500">
                        {entry.employee?.name || entry.department?.name || "Unassigned"}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(entry.allocatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Maintenance History</h2>
          <div className="space-y-3">
            {history.maintenance.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing here yet.</p>
            ) : (
              history.maintenance.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{entry.status}</p>
                      <p className="text-slate-500">{entry.issueDescription}</p>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
