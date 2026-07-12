import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (item.to === "/org-setup") {
      return user?.role === "ADMIN";
    }
    return true;
  });

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate("/login");
    }
  }

  return (
    <div className="flex h-screen">
      <aside className="flex w-60 flex-col bg-slate-900 text-white">
        <div className="border-b border-slate-700 px-4 py-4 text-lg font-bold">AssetFlow</div>
        <nav className="flex-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-3 text-sm hover:bg-slate-800 ${isActive ? "bg-slate-800 font-medium" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <div className="flex items-center gap-3">
            <span className="font-medium">AssetFlow</span>
            {user && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {user.name} - {user.role}
              </span>
            )}
          </div>
          <button onClick={handleLogout} className="text-sm text-slate-600 hover:text-slate-900">
            Log out
          </button>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
