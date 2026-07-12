import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "../lib/api-client";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError("");
    setSubmitting(true);
    try {
      await apiClient.post("/auth/signup", form);
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "VALIDATION_ERROR" && err.fields) {
        setFieldErrors(err.fields);
      } else {
        setGeneralError(err.message || "Signup failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white p-8 rounded-lg shadow-sm border"
      >
        <h1 className="text-2xl font-bold mb-6">Create your account</h1>

        {generalError && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {generalError}
          </div>
        )}

        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2 mb-1"
        />
        {fieldErrors.name && (
          <p className="text-xs text-red-600 mb-2">{fieldErrors.name}</p>
        )}

        <label className="block text-sm font-medium mb-1 mt-3">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2 mb-1"
        />
        {fieldErrors.email && (
          <p className="text-xs text-red-600 mb-2">{fieldErrors.email}</p>
        )}

        <label className="block text-sm font-medium mb-1 mt-3">Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2 mb-1"
        />
        {fieldErrors.password && (
          <p className="text-xs text-red-600 mb-2">{fieldErrors.password}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white rounded py-2 mt-4 font-medium disabled:opacity-50"
        >
          {submitting ? "Creating account..." : "Sign up"}
        </button>

        <p className="text-sm text-center mt-4 text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-medium">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}