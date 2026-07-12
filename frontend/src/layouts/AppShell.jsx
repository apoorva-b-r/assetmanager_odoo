import { NavLink, Outlet } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/org-setup", label: "Organization Setup", icon: "🏢" },
  { to: "/assets", label: "Assets Catalog", icon: "📦" },
  { to: "/allocation", label: "Allocation & Transfer", icon: "📋" },
  { to: "/booking", label: "Resource Booking", icon: "📅" },
  { to: "/maintenance", label: "Maintenance", icon: "🔧" },
  { to: "/audit", label: "Audit Cycles", icon: "🔍" },
  { to: "/reports", label: "Reports", icon: "📈" },
  { to: "/notifications", label: "Notifications", icon: "🔔" },
];

export default function AppShell() {
  return (
    <div className="flex h-screen bg-[#F8F9FC] text-slate-800 font-sans antialiased">
      {/* Sleek Theme Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-full shrink-0">
        <div className="p-6 border-b border-slate-50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-100">
            AF
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-base block">AssetFlow</span>
            <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block">Enterprise Hub</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                  ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-50/50"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`
              }
            >
              <span className="text-base opacity-80">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Primary Window Context View Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-50 flex items-center justify-between px-8 sticky top-0 z-10">
          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Operational Workspace
          </span>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              UX
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}