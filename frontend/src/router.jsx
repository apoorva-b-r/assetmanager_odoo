import { createBrowserRouter, Navigate } from "react-router-dom";
import AppShell from "./layouts/AppShell";
import Dashboard from "./pages/Dashboard";
import OrgSetup from "./pages/OrgSetup";
import Assets from "./pages/Assets";
import Allocation from "./pages/Allocation";
import Booking from "./pages/Booking";
import Maintenance from "./pages/Maintenance";
import Audit from "./pages/Audit";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "org-setup", element: <OrgSetup /> },
      { path: "assets", element: <Assets /> },
      { path: "allocation", element: <Allocation /> },
      { path: "booking", element: <Booking /> },
      { path: "maintenance", element: <Maintenance /> },
      { path: "audit", element: <Audit /> },
      { path: "reports", element: <Reports /> },
      { path: "notifications", element: <Notifications /> },
    ],
  },
]);