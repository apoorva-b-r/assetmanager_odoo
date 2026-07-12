import { NavLink, Outlet } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/org-setup", label: "Organization Setup" },
  { to: "/assets", label: "Assets" },
  { to: "/allocation", label: "Allocation & Transfer" },
  { to: "/booking", label: "Resource Booking" },
  { to: "/maintenance", label: "Maintenance" },
  { to: "/audit", label: "Audit" },
  { to: "/reports", label: "Reports" },
  { to: "/notifications", label: "Notifications" },
];

export default function AppShell() {
  return (
    <div className="flex h-screen">
      <aside className="w-60 bg-slate-900 text-white flex flex-col">
        <div className="px-4 py-4 text-lg font-bold border-b border-slate-700">
          AssetFlow
        </div>
        <nav className="flex-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-3 text-sm hover:bg-slate-800 ${
                  isActive ? "bg-slate-800 font-medium" : ""
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="h-14 border-b flex items-center px-6 font-medium">
          Top Bar
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}