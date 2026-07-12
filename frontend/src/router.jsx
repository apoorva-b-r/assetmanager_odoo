import { createBrowserRouter, Navigate } from "react-router-dom";

import AppShell from "./layouts/AppShell";
import ProtectedRoute from "./layouts/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Dashboard from "./pages/Dashboard";
import OrgSetup from "./pages/OrgSetup";
import Assets from "./pages/Assets";

// Frontend B placeholder imports
import Allocation from "./pages/Allocation";
import Booking from "./pages/Booking";
import Maintenance from "./pages/Maintenance";
import Audit from "./pages/Audit";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";


export const router = createBrowserRouter([
  // Public routes
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },

  // Protected application routes
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },

      {
        path: "dashboard",
        element: <Dashboard />,
      },

      {
        path: "org-setup",
        element: <OrgSetup />,
      },

      {
        path: "assets",
        element: <Assets />,
      },

      // Frontend B routes
      {
        path: "allocation",
        element: <Allocation />,
      },
      {
        path: "booking",
        element: <Booking />,
      },
      {
        path: "maintenance",
        element: <Maintenance />,
      },
      {
        path: "audit",
        element: <Audit />,
      },
      {
        path: "reports",
        element: <Reports />,
      },
      {
        path: "notifications",
        element: <Notifications />,
      },
    ],
  },

  // fallback route
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);