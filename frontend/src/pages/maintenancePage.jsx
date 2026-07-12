import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/api-client";
import { useAuth } from "../context/AuthContext";

const STATUSES = ["PENDING", "TECHNICIAN_ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"];

export default function MaintenancePage() {
  const { user } = useAuth();
  const canManage = user?.role === "ASSET_MANAGER";
  
  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  
  // Create form states
  const [assetId, setAssetId] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [photoUrl, setPhotoUrl] = useState("");
  
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    STATUSES.forEach((status) => map.set(status, []));
    requests.forEach((request) => {
      let key = request.status;
      if (key === "APPROVED") {
        key = "TECHNICIAN_ASSIGNED";
      }
      if (map.has(key)) {
        map.get(key).push(request);
      }
    });
    return map;
  }, [requests]);

  async function loadData() {
    setLoading(true);
    try {
      const [assetData, requestData] = await Promise.all([
        apiClient.get("/assets"),
        apiClient.get("/maintenance-requests").catch(() => []),
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
        photoUrl: photoUrl || null,
      });
      setIssueDescription("");
      setPhotoUrl("");
      setMessage("Maintenance request submitted successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.message || "Failed to create maintenance request.");
    }
  }

  async function approve(id) {
    setMessage("");
    try {
      await apiClient.put(`/maintenance-requests/${id}/approve`);
      await loadData();
      setMessage("Request approved and technician assigned.");
    } catch (error) {
      setMessage(error.message || "Failed to approve request.");
    }
  }

  async function reject(id) {
    const reason = prompt("Enter reason for rejection:", "Does not meet guidelines");
    if (reason === null) return;
    setMessage("");
    try {
      await apiClient.put(`/maintenance-requests/${id}/reject`, { reason });
      await loadData();
      setMessage("Maintenance request rejected.");
    } catch (error) {
      setMessage(error.message || "Failed to reject request.");
    }
  }

  async function startWork(id) {
    setMessage("");
    try {
      await apiClient.put(`/maintenance-requests/${id}/start`);
      await loadData();
      setMessage("Work started on request.");
    } catch (error) {
      setMessage(error.message || "Failed to start maintenance work.");
    }
  }

  async function resolve(id) {
    setMessage("");
    try {
      await apiClient.put(`/maintenance-requests/${id}/resolve`);
      await loadData();
      setMessage("Maintenance request resolved successfully.");
    } catch (error) {
      setMessage(error.message || "Failed to resolve request.");
    }
  }

  if (loading) {
    return <div className="p-4 md:p-8 text-slate-500">Loading maintenance board...</div>;
  }

  return (
    <div className="p-4 md:p-8 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Maintenance Board</h1>
        <p className="mt-1 text-sm text-slate-500">Track and manage asset service cycles from submission to resolution.</p>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Left column: Request Form */}
        <div>
          <form onSubmit={handleCreate} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Raise Request</h2>
              <p className="text-xs text-slate-500">Submit a new issue ticket for any asset.</p>
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
                    {asset.tag} - {asset.name} ({asset.status})
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Issue Description</span>
              <textarea
                value={issueDescription}
                onChange={(event) => setIssueDescription(event.target.value)}
                placeholder="Explain the problem in detail..."
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                required
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
                placeholder="Optional photo path"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
              />
            </label>

            <button type="submit" className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              Submit Request
            </button>
          </form>
        </div>

        {/* Right column: Kanban Grid */}
        <div className="flex gap-4 overflow-x-auto pb-4 select-none">
          {STATUSES.map((status) => (
            <section key={status} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 shadow-sm min-w-[260px] flex-1 flex-shrink-0 flex flex-col h-[700px]">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-2">
                {status === "TECHNICIAN_ASSIGNED" ? "Assigned" : status.replaceAll("_", " ")}
              </h2>
              
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {(grouped.get(status) || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-8">Empty</p>
                ) : (
                  (grouped.get(status) || []).map((request) => {
                    let priorityColor = "bg-slate-100 text-slate-800";
                    if (request.priority === "HIGH") priorityColor = "bg-red-100 text-red-800";
                    if (request.priority === "MEDIUM") priorityColor = "bg-amber-100 text-amber-800";

                    return (
                      <div key={request.id} className="rounded-xl border border-slate-150 bg-white p-4 shadow-sm hover:shadow transition-shadow space-y-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">{request.asset?.tag}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priorityColor}`}>
                            {request.priority}
                          </span>
                        </div>
                        
                        <div>
                          <p className="font-semibold text-slate-700">{request.asset?.name}</p>
                          <p className="text-slate-500 mt-1 line-clamp-3 leading-relaxed">{request.issueDescription}</p>
                        </div>

                        {request.photoUrl && (
                          <img src={request.photoUrl} alt="Issue evidence" className="w-full h-24 object-cover rounded-lg border border-slate-100" />
                        )}

                        <div className="border-t border-slate-100 pt-2 text-[10px] text-slate-400 space-y-1">
                          <p>Requester: <span className="font-medium text-slate-600">{request.raisedBy?.name}</span></p>
                          {request.technicianName && (
                            <p>Technician: <span className="font-medium text-slate-600">{request.technicianName}</span></p>
                          )}
                          <p>Created: <span className="font-medium text-slate-500">{new Date(request.createdAt).toLocaleDateString()}</span></p>
                        </div>

                        {canManage && (
                          <div className="pt-2 flex flex-col gap-1.5 border-t border-slate-100">
                            {status === "PENDING" && (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => approve(request.id)}
                                  className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-[10px] font-bold text-white hover:bg-emerald-700 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => reject(request.id)}
                                  className="flex-1 rounded-lg border border-slate-200 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}

                            {status === "TECHNICIAN_ASSIGNED" && (
                              <button
                                onClick={() => startWork(request.id)}
                                className="w-full rounded-lg bg-blue-600 py-1.5 text-[10px] font-bold text-white hover:bg-blue-700 transition-colors"
                              >
                                Start Repair
                              </button>
                            )}

                            {status === "IN_PROGRESS" && (
                              <button
                                onClick={() => resolve(request.id)}
                                className="w-full rounded-lg bg-slate-900 py-1.5 text-[10px] font-bold text-white hover:bg-slate-800 transition-colors"
                              >
                                Mark Resolved
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
