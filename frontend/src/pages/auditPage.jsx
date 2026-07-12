import { useEffect, useState } from "react";
import { apiClient } from "../lib/api-client";
import { useAuth } from "../context/AuthContext";

export default function AuditPage() {
  const { user, isAdmin } = useAuth();
  const [cycles, setCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState("");
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Create form states
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [scopeLocation, setScopeLocation] = useState("");
  const [scopeDepartmentId, setScopeDepartmentId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedAuditors, setSelectedAuditors] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCycleId) {
      loadCycleDetails(selectedCycleId);
    } else {
      setSelectedCycle(null);
    }
  }, [selectedCycleId]);

  async function loadData() {
    setLoading(true);
    setMessage("");
    try {
      const [cyclesData, deptData] = await Promise.all([
        apiClient.get("/audit-cycles"),
        apiClient.get("/departments").catch(() => []),
      ]);
      setCycles(cyclesData.items || cyclesData || []);
      setDepartments(deptData);

      if (isAdmin) {
        const empData = await apiClient.get("/employees").catch(() => []);
        setEmployees(empData);
      }

      if (cyclesData.items?.length > 0) {
        setSelectedCycleId(cyclesData.items[0].id);
      } else if (cyclesData.length > 0) {
        setSelectedCycleId(cyclesData[0].id);
      }
    } catch (error) {
      setMessage(error.message || "Failed to load audit cycles.");
    } finally {
      setLoading(false);
    }
  }

  async function loadCycleDetails(id) {
    try {
      const data = await apiClient.get(`/audit-cycles/${id}`);
      setSelectedCycle(data);
    } catch (error) {
      setMessage(error.message || "Failed to load cycle details.");
    }
  }

  async function handleCreateCycle(event) {
    event.preventDefault();
    setMessage("");
    try {
      await apiClient.post("/audit-cycles", {
        name,
        scopeLocation: scopeLocation || null,
        scopeDepartmentId: scopeDepartmentId || null,
        startDate,
        endDate,
        auditorIds: selectedAuditors,
      });
      setName("");
      setScopeLocation("");
      setScopeDepartmentId("");
      setStartDate("");
      setEndDate("");
      setSelectedAuditors([]);
      setShowCreate(false);
      await loadData();
      setMessage("Audit cycle created successfully.");
    } catch (error) {
      setMessage(error.message || "Failed to create audit cycle.");
    }
  }

  async function handleVerify(itemId, verificationStatus) {
    const notes = prompt(`Enter notes for marking item as ${verificationStatus}:`, "Checked during audit");
    if (notes === null) return; // User cancelled
    setMessage("");
    try {
      await apiClient.put(`/audit-cycles/items/${itemId}/verify`, {
        verificationStatus,
        notes,
      });
      if (selectedCycleId) {
        await loadCycleDetails(selectedCycleId);
      }
      setMessage("Verification persisted successfully.");
    } catch (error) {
      setMessage(error.message || "Failed to verify item.");
    }
  }

  async function handleCloseCycle(id) {
    if (!confirm("Are you sure you want to close this audit cycle? This will lock the results and mark missing assets as LOST.")) {
      return;
    }
    setMessage("");
    try {
      await apiClient.put(`/audit-cycles/${id}/close`);
      await loadData();
      if (selectedCycleId === id) {
        await loadCycleDetails(id);
      }
      setMessage("Audit cycle finalized and locked successfully.");
    } catch (error) {
      setMessage(error.message || "Failed to close audit cycle.");
    }
  }

  function handleAuditorSelect(empId) {
    setSelectedAuditors((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  }

  const isAuditorForSelectedCycle = selectedCycle?.auditors?.some(
    (auditor) => String(auditor.id) === String(user?.id)
  );

  const canVerify = isAuditorForSelectedCycle || isAdmin;

  if (loading) {
    return <div className="p-8 text-slate-500">Loading audit system...</div>;
  }

  // Derived discrepancies
  const discrepancies = selectedCycle?.auditItems?.filter(
    (item) => item.verificationStatus === "MISSING" || item.verificationStatus === "DAMAGED"
  ) || [];

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Asset Audit</h1>
          <p className="mt-1 text-sm text-slate-500">Verify inventory assets against departmental and location scopes.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {showCreate ? "Cancel" : "+ New Audit Cycle"}
          </button>
        )}
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {message}
        </div>
      )}

      {showCreate && isAdmin && (
        <form onSubmit={handleCreateCycle} className="mb-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Create Audit Cycle</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Cycle Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q3 Electronics Audit"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                required
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Scope Location</span>
              <input
                value={scopeLocation}
                onChange={(e) => setScopeLocation(e.target.value)}
                placeholder="Optional location scope"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Scope Department</span>
              <select
                value={scopeDepartmentId}
                onChange={(e) => setScopeDepartmentId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-2 grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                  required
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium text-slate-700">End Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                  required
                />
              </label>
            </div>
          </div>

          <div className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Assign Auditors</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
              {employees.map((emp) => (
                <label key={emp.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAuditors.includes(emp.id)}
                    onChange={() => handleAuditorSelect(emp.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{emp.name}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Launch Cycle
          </button>
        </form>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left Side: Cycles List */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-3">Audit Cycles</h2>
            <div className="space-y-2">
              {cycles.length === 0 ? (
                <p className="text-xs text-slate-500">No cycles launched yet.</p>
              ) : (
                cycles.map((cycle) => (
                  <button
                    key={cycle.id}
                    onClick={() => setSelectedCycleId(cycle.id)}
                    className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                      selectedCycleId === cycle.id
                        ? "bg-slate-900 border-slate-900 text-white shadow"
                        : "bg-white border-slate-150 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <p className="font-semibold">{cycle.name}</p>
                    <p className={`text-xs mt-1 font-medium ${selectedCycleId === cycle.id ? "text-slate-300" : "text-slate-500"}`}>
                      Status: {cycle.status}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${selectedCycleId === cycle.id ? "text-slate-400" : "text-slate-400"}`}>
                      {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Selected Cycle Details & In-Scope Verification */}
        {selectedCycle ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    selectedCycle.status === "OPEN" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                  }`}>
                    {selectedCycle.status}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-2">{selectedCycle.name}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Location Scope: {selectedCycle.scopeLocation || "All Locations"} | Department Scope: {selectedCycle.scopeDepartment?.name || "All Departments"}
                  </p>
                </div>
                {isAdmin && selectedCycle.status === "OPEN" && (
                  <button
                    onClick={() => handleCloseCycle(selectedCycle.id)}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                  >
                    Lock & Close Cycle
                  </button>
                )}
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Assigned Auditors</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCycle.auditors?.length === 0 ? (
                    <span className="text-xs text-slate-500">None</span>
                  ) : (
                    selectedCycle.auditors?.map((auditor) => (
                      <span key={auditor.id} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {auditor.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Verification items table */}
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">In-Scope Assets Verification</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Tag</th>
                      <th className="px-4 py-3">Asset Name</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Audit Status</th>
                      <th className="px-4 py-3">Notes</th>
                      {selectedCycle.status === "OPEN" && canVerify && <th className="px-4 py-3 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedCycle.auditItems?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          No assets match this cycle's scope.
                        </td>
                      </tr>
                    ) : (
                      selectedCycle.auditItems?.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 font-semibold text-slate-900">{item.asset?.tag}</td>
                          <td className="px-4 py-3 text-slate-700">{item.asset?.name}</td>
                          <td className="px-4 py-3 text-slate-500">{item.asset?.location}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                              item.verificationStatus === "VERIFIED"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.verificationStatus === "MISSING"
                                ? "bg-red-100 text-red-800"
                                : item.verificationStatus === "DAMAGED"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-800"
                            }`}>
                              {item.verificationStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs italic max-w-xs truncate">{item.notes || "—"}</td>
                          {selectedCycle.status === "OPEN" && canVerify && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleVerify(item.id, "VERIFIED")}
                                  className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => handleVerify(item.id, "MISSING")}
                                  className="rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                                >
                                  Missing
                                </button>
                                <button
                                  onClick={() => handleVerify(item.id, "DAMAGED")}
                                  className="rounded-lg bg-amber-600 px-2 py-1 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
                                >
                                  Damaged
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Discrepancy report section */}
            <section className="rounded-2xl border border-red-100 bg-red-50/20 p-6">
              <h2 className="text-lg font-bold text-red-950 mb-2">Discrepancy Report</h2>
              <p className="text-sm text-red-700 mb-4">Automatically generated from missing or damaged verification results.</p>
              
              <div className="space-y-3">
                {discrepancies.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No discrepancies flagged in this cycle.</p>
                ) : (
                  discrepancies.map((item) => (
                    <div key={item.id} className="rounded-xl border border-red-200 bg-white p-4 shadow-sm flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{item.asset?.tag} - {item.asset?.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Location: {item.asset?.location} | Auditor: {item.auditor?.name}
                        </p>
                        {item.notes && <p className="text-xs text-red-700 mt-1 font-medium bg-red-50 px-2.5 py-1 rounded inline-block">Notes: {item.notes}</p>}
                      </div>
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        item.verificationStatus === "MISSING" ? "bg-red-100 text-red-800 animate-pulse" : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.verificationStatus}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500 shadow-sm">
            Select or create an audit cycle to begin verification.
          </div>
        )}
      </div>
    </div>
  );
}
