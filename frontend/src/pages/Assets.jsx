import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../lib/api-client";
import RegisterAssetModal from "./RegisterAssetModal";

export default function AssetDirectory() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAssets();
  }, [search, status]);

  function loadAssets() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);

    apiClient
      .get(`/assets?${params.toString()}`)
      .then((data) => {
        setAssets(data);
        setError("");
      })
      .catch((err) => setError(err.message || "Failed to load assets."))
      .finally(() => setLoading(false));
  }

  const statusStyles = {
    AVAILABLE: "bg-emerald-50 text-emerald-700",
    ALLOCATED: "bg-indigo-50 text-indigo-700",
    RESERVED: "bg-amber-50 text-amber-700",
    UNDER_MAINTENANCE: "bg-orange-50 text-orange-700",
    LOST: "bg-red-50 text-red-700",
    RETIRED: "bg-slate-100 text-slate-500",
    DISPOSED: "bg-slate-100 text-slate-400",
  };

  return (
    <div className="p-8 min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Assets Catalog</h1>
          <p className="text-slate-500 mt-1 text-sm">Centralized register for company equipment.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium"
        >
          + Register Asset
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by tag, serial, or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm w-72 focus:outline-none focus:border-indigo-500 shadow-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ALLOCATED">Allocated</option>
          <option value="RESERVED">Reserved</option>
          <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          <option value="LOST">Lost</option>
          <option value="RETIRED">Retired</option>
          <option value="DISPOSED">Disposed</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
          {error}{" "}
          <button onClick={loadAssets} className="underline font-medium">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Tag</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Nothing here yet.</td></tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      to={`/assets/${asset.id}`}
                      className="font-mono text-xs text-indigo-600 font-semibold"
                    >
                      #{asset.tag}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{asset.name}</td>
                  <td className="px-6 py-4 text-slate-500">{asset.category?.name || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[asset.status] || "bg-slate-100 text-slate-500"}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{asset.location}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <RegisterAssetModal
          onClose={() => setShowModal(false)}
          onRegistered={() => {
            setShowModal(false);
            loadAssets();
          }}
        />
      )}
    </div>
  );
}