import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { apiClient } from "../lib/api-client";

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("loading"); // loading | authed | unauthed

  useEffect(() => {
    apiClient
      .get("/auth/me")
      .then(() => setStatus("authed"))
      .catch(() => setStatus("unauthed"));
  }, []);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center text-slate-500">
        Loading...
      </div>
    );
  }

  if (status === "unauthed") {
    return <Navigate to="/login" replace />;
  }

  return children;
}