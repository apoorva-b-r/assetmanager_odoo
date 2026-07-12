import React from 'react'; // 👈 Add this line right at the very top!
import { createBrowserRouter, Navigate } from "react-router-dom";

import AppShell from "./layouts/AppShell";
import ProtectedRoute from "./layouts/ProtectedRoute";

import Login from "./pages/Login";
import Signup from "./pages/Signup";

import Dashboard from "./pages/Dashboard";
import OrgSetup from "./pages/OrgSetup";
import Assets from "./pages/Assets";
import AssetHistory from "./pages/AssetHistory";

// Frontend B page imports
import Allocation from "./pages/allocationPage";
import Booking from "./pages/bookingPage";
import Maintenance from "./pages/maintenancePage";
import Audit from "./pages/auditPage";
import Reports from "./pages/reportPage";
import Notifications from "./pages/notifications";


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
      {
        path: "assets/:id",
        element: <AssetHistory />,
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
