import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/api-client";
import { useAuth } from "../context/AuthContext";

const STATUSES = ["PENDING", "APPROVED", "REJECTED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS", "RESOLVED"];

export default function MaintenancePage() {
  const { user } = useAuth();
  const canManage = user?.role === "ASSET_MANAGER";
  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [assetId, setAssetId] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [photoUrl, setPhotoUrl] = useState("");
  const [technicianNames, setTechnicianNames] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    STATUSES.forEach((status) => map.set(status, []));
    requests.forEach((request) => {
      map.get(request.status)?.push(request);
    });
    return map;
  }, [requests]);

  async function loadData() {
    setLoading(true);
    try {
      const [assetData, requestData] = await Promise.all([
        apiClient.get("/assets"),
        apiClient.get("/maintenance-requests").catch(() => ({ items: [] })),
      ]);
      setAssets(assetData);
      setRequests(requestData.items || requestData || []);
      if (assetData.length > 0) {
        setAssetId(assetData[0].id);
      }
    } catch (error) {
      setMessage(error.message || "Failed to load maintenance data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    setMessage("");

    try {
      await apiClient.post("/maintenance-requests", {
        assetId,
        issueDescription,
        priority,
        photoUrl,
      });
      setIssueDescription("");
      setPhotoUrl("");
      await loadData();
    } catch (error) {
      setMessage(error.message || "Failed to create maintenance request.");
    }
  }

  async function approve(id) {
    try {
      await apiClient.put(`/maintenance-requests/${id}/approve`);
      await loadData();
    } catch (error) {
      setMessage(error.message || "Failed to approve request.");
    }
  }

  async function reject(id) {
    try {
      await apiClient.put(`/maintenance-requests/${id}/reject`, { reason: "Rejected from UI" });
      await loadData();
    } catch (error) {
      setMessage(error.message || "Failed to reject request.");
    }
  }

  async function assignTechnician(id) {
    try {
      await apiClient.put(`/maintenance-requests/${id}/assign-technician`, {
        technicianName: technicianNames[id] || "",
      });
      await loadData();
    } catch (error) {
      setMessage(error.message || "Failed to assign technician.");
    }
  }

  async function resolve(id) {
    try {
      await apiClient.put(`/maintenance-requests/${id}/resolve`);
      await loadData();
    } catch (error) {
      setMessage(error.message || "Failed to resolve request.");
    }
  }

  if (loading) {
    return <div className="p-8 text-slate-500">Loading maintenance data...</div>;
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Maintenance</h1>
        <p className="mt-1 text-sm text-slate-500">Backend-connected workflow for request, approval, and resolution.</p>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={handleCreate} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Raise Request</h2>
            <p className="text-sm text-slate-500">Any authenticated user can raise a request.</p>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Asset</span>
            <select
              value={assetId}
              onChange={(event) => setAssetId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.tag} - {asset.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Issue</span>
            <textarea
              value={issueDescription}
              onChange={(event) => setIssueDescription(event.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Priority</span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </label>

          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Photo URL</span>
            <input
              value={photoUrl}
              onChange={(event) => setPhotoUrl(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </label>

          <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white">
            Submit Request
          </button>
        </form>

        <div className="grid gap-4 xl:grid-cols-3">
          {STATUSES.map((status) => (
            <section key={status} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-400">{status.replaceAll("_", " ")}</h2>
              <div className="space-y-3">
                {(grouped.get(status) || []).length === 0 ? (
                  <p className="text-sm text-slate-500">Nothing here yet.</p>
                ) : (
                  (grouped.get(status) || []).map((request) => (
                    <div key={request.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                      <p className="font-semibold text-slate-900">{request.asset?.tag || request.assetId}</p>
                      <p className="mt-1 text-slate-500">{request.issueDescription}</p>
                      <p className="mt-1 text-xs text-slate-400">{request.priority}</p>

                      {canManage && (
                        <div className="mt-3 space-y-2">
                          {status === "PENDING" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => approve(request.id)}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => reject(request.id)}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {(status === "APPROVED" || status === "TECHNICIAN_ASSIGNED" || status === "IN_PROGRESS") && (
                            <>
                              <input
                                value={technicianNames[request.id] || ""}
                                onChange={(event) =>
                                  setTechnicianNames((current) => ({ ...current, [request.id]: event.target.value }))
                                }
                                placeholder="Technician name"
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                              />
                              <button
                                onClick={() => assignTechnician(request.id)}
                                className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700"
                              >
                                Assign Technician
                              </button>
                              <button
                                onClick={() => resolve(request.id)}
                                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                              >
                                Resolve
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
