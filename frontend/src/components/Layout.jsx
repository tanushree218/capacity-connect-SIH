import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Bell, LogOut, LayoutDashboard, BookOpen, Award, Users, GraduationCap, Target, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const NAV = {
  admin: [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/gap-dashboard", label: "Competency Gaps", icon: Target },
    { to: "/admin/employees", label: "Employees", icon: Users },
    { to: "/admin/courses", label: "Courses", icon: BookOpen },
  ],
  trainer: [
    { to: "/trainer", label: "Overview", icon: LayoutDashboard },
    { to: "/trainer/courses", label: "My Courses", icon: BookOpen },
    { to: "/trainer/create", label: "Create Course", icon: Sparkles },
  ],
  employee: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/catalog", label: "Course Catalog", icon: BookOpen },
    { to: "/competency", label: "My Competency", icon: Target },
    { to: "/certificates", label: "Certificates", icon: Award },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get("/notifications/me").then((r) => setNotifs(r.data)).catch(() => {});
  }, [user, location.pathname]);

  const unread = notifs.filter((n) => !n.read).length;
  const nav = NAV[user?.role] || [];

  const roleLabel = {
    admin: "Administrator",
    trainer: "Trainer",
    employee: "Employee",
  }[user?.role];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="tri-accent h-1" />
      <header className="sticky top-0 z-50 bg-[#0B192C]/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg" data-testid="app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(user ? `/${user.role === "employee" ? "dashboard" : user.role}` : "/")}>
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#008DDA] to-[#1E3E62] flex items-center justify-center border border-[#D4AF37]/50">
              <Shield size={20} className="text-[#D4AF37]" />
            </div>
            <div>
              <div className="font-display font-bold text-base sm:text-lg tracking-tight">CAPACITY CONNECT</div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">Ministry of Earth Sciences · Govt. of India</div>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-2 rounded-md hover:bg-slate-800 transition" data-testid="notif-trigger">
                    <Bell size={18} />
                    {unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-[#D4AF37] text-[#0B192C] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-white">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifs.length === 0 && (
                    <div className="p-4 text-sm text-slate-500 text-center">No notifications</div>
                  )}
                  {notifs.slice(0, 6).map((n) => (
                    <DropdownMenuItem key={n.id} className="flex-col items-start gap-1 py-2">
                      <div className="text-sm">{n.message}</div>
                      <div className="text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-slate-800 transition" data-testid="user-menu">
                    <div className="w-8 h-8 rounded-full bg-[#008DDA] flex items-center justify-center text-sm font-bold">
                      {user.name?.[0]}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-sm font-semibold leading-tight">{user.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{roleLabel}</div>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { logout(); navigate("/"); }} data-testid="logout-btn">
                    <LogOut size={14} className="mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {user && (
          <aside className="hidden lg:block w-56 shrink-0">
            <nav className="sticky top-24 space-y-1" data-testid="sidebar-nav">
              {nav.map((n) => {
                const active = location.pathname === n.to || (n.to !== "/" && location.pathname.startsWith(n.to));
                const Icon = n.icon;
                return (
                  <Link key={n.to} to={n.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition ${active ? "bg-[#0B192C] text-white shadow" : "text-slate-700 hover:bg-slate-100"}`}
                    data-testid={`nav-${n.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    <Icon size={16} /> {n.label}
                  </Link>
                );
              })}
              <div className="mt-6 p-3 rounded-md bg-gradient-to-br from-[#0B192C] to-[#1E3E62] text-white text-xs">
                <div className="flex items-center gap-1 text-[#D4AF37] font-bold mb-1"><GraduationCap size={14} /> SIH26075</div>
                <div className="text-slate-300 leading-snug">MoES Workforce Capability Platform</div>
              </div>
            </nav>
          </aside>
        )}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

export const StatusBadge = ({ status }) => {
  const map = {
    meets: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Meets Standard" },
    small_gap: { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "Small Gap" },
    major_gap: { cls: "bg-rose-50 text-rose-700 border-rose-200", label: "Major Gap" },
  };
  const s = map[status] || map.meets;
  return <Badge className={`${s.cls} border font-medium`} variant="outline">{s.label}</Badge>;
};
