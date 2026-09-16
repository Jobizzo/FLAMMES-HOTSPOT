"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  CreditCard,
  LayoutDashboard,
  Menu,
  Package,
  Router,
  Search,
  Settings,
  Users,
  Wifi,
  X,
  Network,
  Ticket,
  Receipt,
  ShieldCheck,
  UserRound,
  CircleDollarSign,
  TrendingUp,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Activation", href: "/sessions", icon: Ticket },
  { label: "Data Usage", href: "/reports", icon: Activity },
  { label: "Hotspot Vouchers", href: "/packages", icon: Ticket },
  { label: "Hotspot Binding", href: "/routers", icon: Wifi },
  { label: "Packages / Plans", href: "/packages", icon: Package },
  { label: "Transactions", href: "/payments", icon: Receipt },
  { label: "Network", href: "/routers", icon: Network },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

const stats = [
  { label: "INCOME TODAY", value: "KSh. 0", icon: CircleDollarSign, tone: "orange", link: "View Reports" },
  { label: "INCOME THIS MONTH", value: "KSh. 0", icon: TrendingUp, tone: "green", link: "View Reports" },
  { label: "ACTIVE / EXPIRED", value: "0 / 0", icon: UserRound, tone: "blue", link: "View All" },
  { label: "TOTAL USERS", value: "0", icon: Users, tone: "red", link: "View All" },
  { label: "HOTSPOT ONLINE USERS", value: "0", icon: Wifi, tone: "teal", link: "View All" },
  { label: "PPPOE ONLINE USERS", value: "0", icon: Network, tone: "purple", link: "View All" },
  { label: "STATIC ONLINE USERS", value: "0", icon: Router, tone: "green", link: "View All" },
  { label: "TOTAL ONLINE USERS", value: "0", icon: Users, tone: "brown", link: "View All" },
];

const toneClasses: Record<string, string> = {
  orange: "bg-orange-50 border-orange-100 text-orange-700",
  green: "bg-emerald-50 border-emerald-100 text-emerald-700",
  blue: "bg-blue-50 border-blue-100 text-blue-700",
  red: "bg-red-50 border-red-100 text-red-700",
  teal: "bg-teal-50 border-teal-100 text-teal-700",
  purple: "bg-violet-50 border-violet-100 text-violet-700",
  brown: "bg-amber-50 border-amber-100 text-amber-700",
};

export default function Dashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900">
      <aside className="admin-sidebar fixed inset-y-0 left-0 z-40 hidden w-64 overflow-y-auto border-r border-gray-800 md:block">
        <div className="flex h-16 items-center gap-3 border-b border-gray-800 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-500 text-white font-black">F</div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-white">FLAMMES</div>
            <div className="text-[9px] font-bold tracking-[.22em] text-orange-400">HOTSPOT</div>
          </div>
        </div>
        <div className="p-3">
          <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">Management</div>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/";
              return (
                <Link key={item.label} href={item.href} className={`admin-nav-item flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium ${active ? "active" : ""}`}>
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 bg-[#0b1220] p-3">
          <div className="flex items-center gap-2 rounded-md bg-gray-800/70 p-3">
            <span className="status-dot status-dot-online" />
            <div>
              <div className="text-xs font-semibold text-white">System Online</div>
              <div className="text-[10px] text-gray-400">Ready for operations</div>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-label="Close menu" />
          <aside className="admin-sidebar relative h-full w-72 overflow-y-auto p-3">
            <div className="flex h-14 items-center justify-between px-2">
              <div className="font-extrabold text-white">FLAMMES HOTSPOT</div>
              <button onClick={() => setMobileOpen(false)} className="rounded p-2 hover:bg-gray-800"><X size={20} /></button>
            </div>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)} className={`admin-nav-item flex items-center gap-3 px-3 py-2.5 text-sm ${item.href === "/" ? "active" : ""}`}><Icon size={17} />{item.label}</Link>;
              })}
            </nav>
          </aside>
        </div>
      )}

      <main className="min-w-0 md:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="rounded-md p-2 hover:bg-gray-100 md:hidden" aria-label="Open menu"><Menu size={21} /></button>
            <div className="hidden text-sm text-gray-500 sm:block">Dashboard</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden w-64 md:block">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs outline-none focus:border-orange-400" placeholder="Search users..." />
            </div>
            <button className="relative rounded-md border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50" aria-label="Notifications"><Bell size={17} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-orange-500" /></button>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">A</div>
              <span className="text-xs font-semibold text-gray-700">Administrator</span>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-xs text-gray-500">Monitor your hotspot, customers, revenue and network activity.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600"><span className="status-dot status-dot-online" /> System online</span>
              <button className="flames-button">Refresh Data</button>
            </div>
          </div>

          <section className="mb-5 overflow-hidden rounded-md border border-blue-600 bg-white">
            <div className="flex flex-col gap-3 bg-blue-600 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold"><Router size={17} /> Router View</div>
              <select className="rounded-md border-0 bg-white px-3 py-2 text-xs text-gray-700 outline-none"><option>All Routers - System Wide</option></select>
            </div>
          </section>

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={`rounded-lg border p-4 shadow-sm ${toneClasses[stat.tone]}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-2xl font-bold leading-none">{stat.value}</div>
                      <div className="mt-2 text-[10px] font-bold uppercase tracking-wide opacity-80">{stat.label}</div>
                    </div>
                    <Icon size={27} className="opacity-35" />
                  </div>
                  <div className="mt-4 border-t border-current/10 pt-2 text-[10px] font-medium opacity-75">{stat.link} →</div>
                </div>
              );
            })}
          </section>

          <div className="grid gap-5 xl:grid-cols-3">
            <section className="flames-card overflow-hidden xl:col-span-2">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800"><BarChart3 size={17} className="text-blue-600" /> Monthly Registered Customers</div>
                <div className="flex gap-1"><button className="rounded bg-gray-100 px-2 py-1 text-xs">−</button><button className="rounded bg-gray-100 px-2 py-1 text-xs">×</button></div>
              </div>
              <div className="p-4">
                <div className="mb-2 flex items-center gap-2 text-[11px] text-gray-500"><span className="h-2 w-6 rounded-sm bg-blue-500" /> Registered Members</div>
                <div className="relative h-56 border-l border-b border-gray-200 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_44px,#eef0f2_45px)]">
                  <div className="absolute bottom-0 left-0 right-0 flex h-full items-end justify-around px-4">
                    {[12, 28, 20, 42, 34, 58, 48, 68, 55, 76, 63, 82].map((height, i) => <div key={i} className="w-[5%] max-w-8 rounded-t bg-blue-500/70" style={{ height: `${height}%` }} />)}
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-[9px] text-gray-400"><span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span></div>
              </div>
            </section>

            <div className="space-y-5">
              <section className="flames-card overflow-hidden">
                <div className="bg-blue-600 px-4 py-3 text-sm font-semibold text-white">Payment Gateway</div>
                <div className="p-4">
                  <div className="flex items-center justify-between border-b border-gray-100 py-3"><span className="text-xs text-gray-500">M-Pesa</span><span className="badge badge-success">Ready</span></div>
                  <div className="flex items-center justify-between py-3"><span className="text-xs text-gray-500">Payment API</span><span className="badge badge-warning">Configure</span></div>
                  <Link href="/payments" className="mt-2 inline-block text-xs font-semibold text-blue-600">Manage payment settings →</Link>
                </div>
              </section>

              <section className="flames-card overflow-hidden">
                <div className="bg-blue-600 px-4 py-3 text-sm font-semibold text-white">All Users Insights</div>
                <div className="p-4">
                  <div className="flex items-start gap-3 rounded-md bg-sky-50 p-3">
                    <ShieldCheck size={21} className="mt-0.5 text-blue-600" />
                    <div><div className="text-xs font-semibold text-gray-800">System support</div><p className="mt-1 text-[11px] leading-5 text-gray-500">Your hotspot dashboard is ready. Connect routers and create packages to begin serving customers.</p></div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-center"><div className="rounded border border-gray-200 p-3"><div className="text-lg font-bold">0</div><div className="text-[9px] uppercase text-gray-400">Online</div></div><div className="rounded border border-gray-200 p-3"><div className="text-lg font-bold">0</div><div className="text-[9px] uppercase text-gray-400">Routers</div></div></div>
                </div>
              </section>
            </div>
          </div>

          <section className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="flames-card p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Quick Actions</h2><span className="text-[10px] text-gray-400">Control center</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[[Users,"Customers","/customers"],[Package,"Packages","/packages"],[Router,"Routers","/routers"],[CreditCard,"Payments","/payments"]].map(([Icon,label,href]) => { const I = Icon as typeof Users; return <Link key={label as string} href={href as string} className="rounded-md border border-gray-200 p-3 hover:border-orange-300 hover:bg-orange-50"><I size={17} className="text-orange-500" /><div className="mt-2 text-xs font-semibold">{label as string}</div></Link>; })}</div></div>
            <div className="flames-card p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Network Status</h2><span className="badge badge-success">Operational</span></div><div className="grid grid-cols-3 gap-2"><div className="rounded-md bg-gray-50 p-3"><div className="text-xs text-gray-500">Routers</div><div className="mt-1 text-xl font-bold">0</div></div><div className="rounded-md bg-gray-50 p-3"><div className="text-xs text-gray-500">Sessions</div><div className="mt-1 text-xl font-bold">0</div></div><div className="rounded-md bg-gray-50 p-3"><div className="text-xs text-gray-500">Customers</div><div className="mt-1 text-xl font-bold">0</div></div></div></div>
          </section>
        </div>
      </main>
    </div>
  );
}
