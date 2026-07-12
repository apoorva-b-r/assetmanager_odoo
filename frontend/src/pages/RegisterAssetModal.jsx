import { useEffect, useState } from "react";
import { apiClient } from "../lib/api-client";

const initialForm = {
  name: "",
  categoryId: "",
  serialNumber: "",
  acquisitionDate: new Date().toISOString().slice(0, 10),
  acquisitionCost: "",
  condition: "",
  location: "",
  isBookable: false,
  photoUrl: "",
};

export default function RegisterAssetModal({ categories = [], onClose, onRegistered }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleChange(event) {
    const { name, type, value, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await apiClient.post("/assets", {
        ...form,
        acquisitionCost: Number(form.acquisitionCost),
      });
      setForm(initialForm);
      onRegistered?.();
    } catch (err) {
      setError(err.message || "Failed to register asset.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Register Asset</h2>
            <p className="text-sm text-slate-500">Create a new asset with the backend-generated tag.</p>
          </div>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm text-slate-500 hover:bg-slate-100">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 p-6 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Name</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Category</span>
            <select
              name="categoryId"
              value={form.categoryId}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Serial Number</span>
            <input
              name="serialNumber"
              value={form.serialNumber}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Acquisition Date</span>
            <input
              type="date"
              name="acquisitionDate"
              value={form.acquisitionDate}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Acquisition Cost</span>
            <input
              type="number"
              step="0.01"
              name="acquisitionCost"
              value={form.acquisitionCost}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Location</span>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Condition</span>
            <input
              name="condition"
              value={form.condition}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </label>

          <label className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">Photo URL</span>
            <input
              name="photoUrl"
              value={form.photoUrl}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              name="isBookable"
              checked={form.isBookable}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-300"
            />
            Bookable resource
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Create Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
