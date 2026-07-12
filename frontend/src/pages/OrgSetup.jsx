import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../lib/api-client";
import { useAuth } from "../context/AuthContext";

const TABS = [
  { id: "departments", label: "Departments" },
  { id: "categories", label: "Asset Categories" },
  { id: "employees", label: "Employee Directory" },
];

export default function OrgSetup() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="p-8 min-h-screen">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 max-w-lg mx-auto shadow-sm">
          <h2 className="text-lg font-bold">Access Denied</h2>
          <p className="mt-2 text-sm">You must be an Administrator to access the Organization Setup workspace.</p>
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState("departments");
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    headId: "",
    parentDepartmentId: "",
    status: "ACTIVE",
  });
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    warrantyPeriodMonths: "",
  });
  const [savingDepartment, setSavingDepartment] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [promotingId, setPromotingId] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const employeeOptions = useMemo(() => employees.filter((employee) => employee.status === "ACTIVE"), [employees]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [departmentData, categoryData, employeeData] = await Promise.all([
        apiClient.get("/departments"),
        apiClient.get("/asset-categories"),
        apiClient.get("/employees").catch(() => []),
      ]);

      setDepartments(departmentData);
      setCategories(categoryData);
      setEmployees(employeeData);
    } catch (err) {
      setError(err.message || "Failed to load organization data.");
    } finally {
      setLoading(false);
    }
  }

  async function createDepartment(event) {
    event.preventDefault();
    setSavingDepartment(true);
    setError("");

    try {
      await apiClient.post("/departments", {
        name: departmentForm.name,
        headId: departmentForm.headId || null,
        parentDepartmentId: departmentForm.parentDepartmentId || null,
        status: departmentForm.status,
      });
      setDepartmentForm({ name: "", headId: "", parentDepartmentId: "", status: "ACTIVE" });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to create department.");
    } finally {
      setSavingDepartment(false);
    }
  }

  async function createCategory(event) {
    event.preventDefault();
    setSavingCategory(true);
    setError("");

    try {
      await apiClient.post("/asset-categories", {
        name: categoryForm.name,
        warrantyPeriodMonths: categoryForm.warrantyPeriodMonths || null,
      });
      setCategoryForm({ name: "", warrantyPeriodMonths: "" });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to create category.");
    } finally {
      setSavingCategory(false);
    }
  }

  async function promoteEmployee(employeeId, role) {
    setPromotingId(employeeId);
    setError("");

    try {
      await apiClient.put(`/employees/${employeeId}/role`, { role });
      await loadData();
    } catch (err) {
      setError(err.message || "Failed to promote employee.");
    } finally {
      setPromotingId("");
    }
  }

  const tabContent = {
    departments: (
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={createDepartment} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create Department</h2>
            <p className="text-sm text-slate-500">Admin-only write access.</p>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Name</span>
            <input
              value={departmentForm.name}
              onChange={(event) => setDepartmentForm({ ...departmentForm, name: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Head</span>
            <select
              value={departmentForm.headId}
              onChange={(event) => setDepartmentForm({ ...departmentForm, headId: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            >
              <option value="">None</option>
              {employeeOptions.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Parent Department</span>
            <select
              value={departmentForm.parentDepartmentId}
              onChange={(event) => setDepartmentForm({ ...departmentForm, parentDepartmentId: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            >
              <option value="">None</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Status</span>
            <select
              value={departmentForm.status}
              onChange={(event) => setDepartmentForm({ ...departmentForm, status: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={!isAdmin || savingDepartment}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {savingDepartment ? "Saving..." : "Create Department"}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Departments</h2>
          <div className="space-y-3">
            {departments.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing here yet.</p>
            ) : (
              departments.map((department) => (
                <div key={department.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{department.name}</p>
                      <p className="text-sm text-slate-500">
                        {department.head?.name || "No head assigned"}
                        {department.parentDepartment?.name ? ` · Parent: ${department.parentDepartment.name}` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                      {department.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    ),
    categories: (
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={createCategory} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create Category</h2>
            <p className="text-sm text-slate-500">Admin-only write access.</p>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Name</span>
            <input
              value={categoryForm.name}
              onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Warranty Months</span>
            <input
              type="number"
              value={categoryForm.warrantyPeriodMonths}
              onChange={(event) => setCategoryForm({ ...categoryForm, warrantyPeriodMonths: event.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </label>
          <button
            type="submit"
            disabled={!isAdmin || savingCategory}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {savingCategory ? "Saving..." : "Create Category"}
          </button>
        </form>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Asset Categories</h2>
          <div className="space-y-3">
            {categories.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing here yet.</p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{category.name}</p>
                      <p className="text-sm text-slate-500">
                        {category.warrantyPeriodMonths ? `${category.warrantyPeriodMonths} month warranty` : "No warranty period"}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">
                      {category.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    ),
    employees: (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Employee Directory</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Nothing here yet.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{employee.name}</td>
                    <td className="px-4 py-3 text-slate-500">{employee.email}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {departments.find((department) => department.id === employee.departmentId)?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{employee.role}</td>
                    <td className="px-4 py-3 text-slate-500">{employee.status}</td>
                    <td className="px-4 py-3">
                      {isAdmin && employee.role === "EMPLOYEE" ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => promoteEmployee(employee.id, "DEPT_HEAD")}
                            disabled={promotingId === employee.id}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-60"
                          >
                            Promote to Dept Head
                          </button>
                          <button
                            onClick={() => promoteEmployee(employee.id, "ASSET_MANAGER")}
                            disabled={promotingId === employee.id}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                          >
                            Promote to Asset Manager
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No action</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    ),
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Loading organization setup...</div>;
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Organization Setup</h1>
        <p className="text-slate-500 mt-1 text-sm">Manage departments, categories, and employee access.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              activeTab === tab.id ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabContent[activeTab]}
    </div>
  );
}
