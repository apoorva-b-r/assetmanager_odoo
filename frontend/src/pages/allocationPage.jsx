import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/api-client";
import { useAuth } from "../context/AuthContext";

export default function AllocationPage() {
  const { user, isAdmin } = useAuth();
  const canAllocate = user?.role === "ASSET_MANAGER" || user?.role === "DEPT_HEAD";

  const [assets, setAssets] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [transferRequests, setTransferRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [returnCondition, setReturnCondition] = useState("");
  const [transferToUserId, setTransferToUserId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [historyAssetId, setHistoryAssetId] = useState("");
  const [history, setHistory] = useState({ allocations: [], maintenance: [] });
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(null);
  const [loading, setLoading] = useState(true);

  const assetMap = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets]);
  const activeAllocation = allocations.find(
    (allocation) => String(allocation.assetId) === String(selectedAssetId) && allocation.status === "ACTIVE",
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (historyAssetId) {
      loadHistory(historyAssetId);
    }
  }, [historyAssetId]);

  async function loadData() {
    setLoading(true);
    try {
      const [assetData, allocationData, transferRequestData, deptData] = await Promise.all([
        apiClient.get("/assets"),
        apiClient.get("/allocations").catch(() => ({ items: [] })),
        apiClient.get("/transfer-requests").catch(() => ({ items: [] })),
        apiClient.get("/departments").catch(() => []),
      ]);
      const employeeData = canAllocate || isAdmin ? await apiClient.get("/employees").catch(() => []) : [];

      setAssets(assetData);
      setAllocations(allocationData.items || []);
      setTransferRequests(transferRequestData.items || transferRequestData || []);
      setEmployees(employeeData);
      setDepartments(deptData);

      if (!selectedAssetId && assetData.length > 0) {
        setSelectedAssetId(assetData[0].id);
      }
      if (!historyAssetId && assetData.length > 0) {
        setHistoryAssetId(assetData[0].id);
      }
    } catch (error) {
      setMessage(error.message || "Failed to load allocation data.");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(assetId) {
    try {
      const data = await apiClient.get(`/assets/${assetId}/history`);
      setHistory(data);
    } catch (error) {
      setMessage(error.message || "Failed to load asset history.");
    }
  }

  async function handleAllocate(event) {
    event.preventDefault();
    setMessage("");
    setConflict(null);

    try {
      const payload = {
        assetId: selectedAssetId,
        expectedReturnDate,
      };

      if (selectedEmployeeId) {
        payload.employeeId = selectedEmployeeId;
      } else if (selectedDepartmentId) {
        payload.departmentId = selectedDepartmentId;
      }

      await apiClient.post("/allocations", payload);
      setExpectedReturnDate("");
      setSelectedEmployeeId("");
      setSelectedDepartmentId("");
      await loadData();
    } catch (error) {
      if (error.code === "ALLOCATION_CONFLICT") {
        setConflict(error.data?.currentHolder || null);
      }
      setMessage(error.message || "Failed to allocate asset.");
    }
  }

  async function handleReturn(allocationId) {
    const notes = prompt("Enter return condition notes (e.g. GOOD, DAMAGED, LOST):", "GOOD");
    if (notes === null) return; // User cancelled
    setMessage("");
    try {
      await apiClient.post(`/allocations/${allocationId}/return`, {
        returnCondition: notes,
      });
      await loadData();
    } catch (error) {
      setMessage(error.message || "Failed to return allocation.");
    }
  }

  async function handleCreateTransfer(event) {
    event.preventDefault();
    setMessage("");

    try {
      const targetUserId = canAllocate ? transferToUserId : user?.id;
      if (!targetUserId) {
        throw new Error("Target user ID is required.");
      }

      await apiClient.post("/transfer-requests", {
        assetId: selectedAssetId,
        toUserId: targetUserId,
        reason: transferReason,
      });
      setTransferToUserId("");
      setTransferReason("");
      setMessage("Transfer request submitted successfully.");
      await loadData();
    } catch (error) {
      setMessage(error.message || "Failed to create transfer request.");
    }
  }

  async function handleApproveTransfer(id) {
    try {
      await apiClient.put(`/transfer-requests/${id}/approve`);
      await loadData();
    } catch (error) {
      setMessage(error.message || "Failed to approve transfer.");
    }
  }

  async function handleRejectTransfer(id) {
    try {
      await apiClient.put(`/transfer-requests/${id}/reject`);
      await loadData();
    } catch (error) {
      setMessage(error.message || "Failed to reject transfer.");
    }
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Allocation & Transfer</h1>
        <p className="mt-1 text-sm text-slate-500">
          Role-Based asset management workspace for {user?.name} ({user?.role}).
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

      {conflict && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Already allocated to {conflict.name || conflict.id}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          {canAllocate ? (
            <>
              <form onSubmit={handleAllocate} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Create Allocation</h2>
                  <p className="text-sm text-slate-500">Assets must be available before you assign them.</p>
                </div>

                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Asset</span>
                  <select
                    value={selectedAssetId}
                    onChange={(event) => setSelectedAssetId(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                  >
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.tag} - {asset.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="block space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Employee</span>
                    <select
                      value={selectedEmployeeId}
                      onChange={(event) => {
                        setSelectedEmployeeId(event.target.value);
                        setSelectedDepartmentId(""); // Clear department if employee is selected
                      }}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                    >
                      <option value="">Select employee</option>
                      {employees.filter(emp => emp.status === "ACTIVE").map((employee) => {
                        const deptName = departments.find(d => d.id === employee.departmentId)?.name || "No Department";
                        return (
                          <option key={employee.id} value={employee.id}>
                            {employee.name} ({employee.email} · {deptName})
                          </option>
                        );
                      })}
                    </select>
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Department</span>
                    <select
                      value={selectedDepartmentId}
                      onChange={(event) => {
                        setSelectedDepartmentId(event.target.value);
                        setSelectedEmployeeId(""); // Clear employee if department is selected
                      }}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                    >
                      <option value="">Select department</option>
                      {departments.filter(dept => dept.status === "ACTIVE").map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block space-y-1 text-sm">
                  <span className="font-medium text-slate-700">Expected Return Date</span>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(event) => setExpectedReturnDate(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                  />
                </label>

                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  Allocate
                </button>
              </form>

              {conflict && (
                <form onSubmit={handleCreateTransfer} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Transfer Request</h2>
                    <p className="text-sm text-slate-500">Use this when allocation hits a live holder conflict.</p>
                  </div>

                  <label className="block space-y-1 text-sm">
                    <span className="font-medium text-slate-700">To User</span>
                    {employees.length > 0 ? (
                      <select
                        value={transferToUserId}
                        onChange={(event) => setTransferToUserId(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                      >
                        <option value="">Select user</option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={transferToUserId}
                        onChange={(event) => setTransferToUserId(event.target.value)}
                        placeholder="User id"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                      />
                    )}
                  </label>

                  <label className="block space-y-1 text-sm">
                    <span className="font-medium text-slate-700">Reason</span>
                    <textarea
                      value={transferReason}
                      onChange={(event) => setTransferReason(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                      rows={3}
                      required
                    />
                  </label>

                  <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors">
                    Request Transfer
                  </button>
                </form>
              )}
            </>
          ) : (
            <form onSubmit={handleCreateTransfer} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Request Asset Transfer</h2>
                <p className="text-sm text-slate-500">Request an asset that is currently allocated to another user.</p>
              </div>

              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Asset</span>
                <select
                  value={selectedAssetId}
                  onChange={(event) => setSelectedAssetId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                >
                  <option value="">Select an asset</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.tag} - {asset.name} ({asset.status})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Transfer To</span>
                <input
                  value={user?.name || ""}
                  disabled
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-slate-500 cursor-not-allowed"
                />
              </label>

              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Reason</span>
                <textarea
                  value={transferReason}
                  onChange={(event) => setTransferReason(event.target.value)}
                  placeholder="State the reason why you need this asset..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                  rows={3}
                  required
                />
              </label>

              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                disabled={loading || !selectedAssetId}
              >
                Submit Transfer Request
              </button>
            </form>
          )}
        </div>

        <div className="space-y-6">
          {canAllocate ? (
            <>
              <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Active Allocations</h2>
                    <p className="text-sm text-slate-500">Selected asset: {assetMap.get(selectedAssetId)?.name || "None"}</p>
                  </div>
                  <select
                    value={historyAssetId}
                    onChange={(event) => setHistoryAssetId(event.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
                  >
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.tag}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {allocations.length === 0 ? (
                    <p className="text-sm text-slate-500">Nothing here yet.</p>
                  ) : (
                    allocations.map((allocation) => {
                      const canReturn = allocation.status === "ACTIVE";

                      return (
                        <div key={allocation.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {allocation.asset?.tag || allocation.assetId} - {allocation.asset?.name || "Asset"}
                              </p>
                              <p className="text-sm text-slate-500">
                                Holder: {allocation.employee?.name || allocation.department?.name || "Unassigned"} - Status: {allocation.status}
                              </p>
                            </div>
                            {canReturn && (
                              <button
                                onClick={() => handleReturn(allocation.id)}
                                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
                              >
                                Return
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Allocation History</h2>
                <div className="space-y-3">
                  {(history.allocations || []).length === 0 ? (
                    <p className="text-sm text-slate-500">Nothing here yet.</p>
                  ) : (
                    history.allocations.map((entry) => (
                      <div key={entry.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                        <p className="font-medium text-slate-900">
                          {entry.asset?.tag || entry.assetId} - {entry.status}
                        </p>
                        <p className="text-slate-500">{entry.employee?.name || entry.department?.name || "Unassigned"}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {activeAllocation && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Selected asset is currently allocated to{" "}
                  {activeAllocation.employee?.name || activeAllocation.department?.name || "someone"}
                </div>
              )}

              <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Transfer Requests</h2>
                <div className="space-y-3">
                  {transferRequests.length === 0 ? (
                    <p className="text-sm text-slate-500">Nothing here yet.</p>
                  ) : (
                    transferRequests.map((request) => (
                      <div key={request.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <p className="font-semibold text-slate-900">
                          {request.asset?.tag || request.assetId} - {request.status}
                        </p>
                        <p className="text-sm text-slate-500">
                          {request.fromUser?.name || request.fromUserId} -&gt; {request.toUser?.name || request.toUserId}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{request.reason}</p>
                        {request.status === "REQUESTED" && (
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => handleApproveTransfer(request.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectTransfer(request.id)}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          ) : (
            <>
              <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-2">My Active Assets</h2>
                <p className="text-sm text-slate-500 mb-4">Assets currently allocated to you.</p>

                <div className="space-y-3">
                  {allocations.filter((a) => String(a.employeeId) === String(user?.id) && a.status === "ACTIVE").length === 0 ? (
                    <p className="text-sm text-slate-500">No active assets allocated to you.</p>
                  ) : (
                    allocations
                      .filter((a) => String(a.employeeId) === String(user?.id) && a.status === "ACTIVE")
                      .map((allocation) => (
                        <div key={allocation.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {allocation.asset?.tag || allocation.assetId} - {allocation.asset?.name || "Asset"}
                              </p>
                              <p className="text-xs text-slate-500">
                                Expected Return: {allocation.expectedReturnDate ? new Date(allocation.expectedReturnDate).toLocaleDateString() : "No date"}
                              </p>
                            </div>
                            <button
                              onClick={() => handleReturn(allocation.id)}
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
                            >
                              Return
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 mb-2">My Transfer Requests</h2>
                <p className="text-sm text-slate-500 mb-4">Requests you have submitted.</p>

                <div className="space-y-3">
                  {transferRequests.filter((r) => String(r.toUserId) === String(user?.id) || String(r.fromUserId) === String(user?.id)).length === 0 ? (
                    <p className="text-sm text-slate-500">No transfer requests submitted.</p>
                  ) : (
                    transferRequests
                      .filter((r) => String(r.toUserId) === String(user?.id) || String(r.fromUserId) === String(user?.id))
                      .map((request) => (
                        <div key={request.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                          <p className="font-semibold text-slate-900">
                            {request.asset?.tag || request.assetId} - {request.status}
                          </p>
                          <p className="text-xs text-slate-500">
                            Status: <span className={`font-semibold ${request.status === 'APPROVED' ? 'text-emerald-600' : request.status === 'REJECTED' ? 'text-red-600' : 'text-amber-600'}`}>{request.status}</span>
                          </p>
                          <p className="mt-1 text-sm text-slate-600">{request.reason}</p>
                        </div>
                      ))
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
