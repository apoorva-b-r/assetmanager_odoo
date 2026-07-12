import { createBrowserRouter, Navigate } from "react-router-dom";
import AppShell from "./layouts/AppShell";
import Dashboard from "./pages/Dashboard"; // verify if this file name is exact
import OrgSetup from "./pages/org_setup";
import Assets from "./pages/asset";
import Allocation from "./pages/allocation";
import Booking from "./pages/booking";
import Maintenance from "./pages/maintenance";
import Audit from "./pages/audit";
import Reports from "./pages/report";
import Notifications from "./pages/notifications";

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