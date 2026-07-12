import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../lib/api-client";
import RegisterAssetModal from "./RegisterAssetModal";

const STATUS_OPTIONS = [
  "AVAILABLE",
  "ALLOCATED",
  "RESERVED",
  "UNDER_MAINTENANCE",
  "LOST",
  "RETIRED",
  "DISPOSED",
];

const statusStyles = {
  AVAILABLE: "bg-emerald-50 text-emerald-700",
  ALLOCATED: "bg-indigo-50 text-indigo-700",
  RESERVED: "bg-amber-50 text-amber-700",
  UNDER_MAINTENANCE: "bg-orange-50 text-orange-700",
  LOST: "bg-red-50 text-red-700",
  RETIRED: "bg-slate-100 text-slate-500",
  DISPOSED: "bg-slate-100 text-slate-400",
};

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadAssets();
  }, [search, category, status, department, location]);

  async function loadCategories() {
    try {
      const data = await apiClient.get("/asset-categories");
      setCategories(data);
    } catch {
      setCategories([]);
    }
  }

  async function loadAssets() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      if (department.trim()) params.set("department", department.trim());
      if (location.trim()) params.set("location", location.trim());

      const data = await apiClient.get(`/assets${params.toString() ? `?${params.toString()}` : ""}`);
      setAssets(data);
    } catch (err) {
      setError(err.message || "Failed to load assets.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Assets Catalog</h1>
          <p className="text-slate-500 mt-1 text-sm">Centralized register for company equipment.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm"
        >
          + Register Asset
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-5 mb-6">
        <input
          type="text"
          placeholder="Search by tag, serial, or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm"
        >
          <option value="">All Categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Department filter"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm"
        />
        <input
          type="text"
          placeholder="Location filter"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm"
        />
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
          {error}{" "}
          <button onClick={loadAssets} className="underline font-medium">
            Retry
          </button>
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
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  Nothing here yet.
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/assets/${asset.id}`} className="font-mono text-xs text-indigo-600 font-semibold">
                      #{asset.tag}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{asset.name}</td>
                  <td className="px-6 py-4 text-slate-500">{asset.category?.name || "—"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusStyles[asset.status] || "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {asset.status.replaceAll("_", " ")}
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
          categories={categories}
          onClose={() => setShowModal(false)}
          onRegistered={() => {
            setShowModal(false);
            loadAssets();
            loadCategories();
          }}
        />
      )}
    </div>
  );
}
