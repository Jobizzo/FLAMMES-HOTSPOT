"use client";

import Link from "next/link";
import {
  Activity,
  CircleDollarSign,
  LayoutDashboard,
  Users,
  Wifi,
  Router,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  Menu,
  Bell,
  ShieldCheck,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

const menuItems = [
  {
    name: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Packages",
    href: "/packages",
    icon: Package,
  },
  {
    name: "Sessions",
    href: "/sessions",
    icon: Wifi,
  },
  {
    name: "Payments",
    href: "/payments",
    icon: CreditCard,
  },
  {
    name: "Routers",
    href: "/routers",
    icon: Router,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

const stats = [
  {
    title: "Active Users",
    value: "0",
    change: "+0%",
    description: "Currently connected",
    icon: Users,
    badge: "LIVE",
    color: "from-blue-600 to-blue-400",
  },
  {
    title: "Today's Revenue",
    value: "KES 0",
    change: "+0%",
    description: "Hotspot sales today",
    icon: CircleDollarSign,
    badge: "LIVE",
    color: "from-green-600 to-green-400",
  },
  {
    title: "Online Sessions",
    value: "0",
    change: "+0%",
    description: "Active sessions",
    icon: Activity,
    badge: "LIVE",
    color: "from-purple-600 to-purple-400",
  },
  {
    title: "Connected Routers",
    value: "0",
    change: "+0%",
    description: "Routers online",
    icon: Router,
    badge: "LIVE",
    color: "from-amber-600 to-amber-400",
  },
];

const recentActivities = [
  {
    id: 1,
    action: "Customer registered",
    details: "John Doe (KES 500 package)",
    time: "2 minutes ago",
    icon: Users,
  },
  {
    id: 2,
    action: "Payment received",
    details: "M-Pesa transaction #12345",
    time: "15 minutes ago",
    icon: CreditCard,
  },
  {
    id: 3,
    action: "Router connected",
    details: "TP-Link Archer C7 (Westlands)",
    time: "1 hour ago",
    icon: Router,
  },
  {
    id: 4,
    action: "Session expired",
    details: "Jane Smith (2-hour pass)",
    time: "2 hours ago",
    icon: Wifi,
  },
];

export default function Dashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-[#252525] bg-[#0b0b0b] p-5 md:block sticky top-0 h-screen overflow-y-auto">
          {/* Logo */}
          <div className="mb-10 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-xl font-bold shadow-lg">
                🔥
              </div>

              <div>
                <h1 className="text-lg font-black tracking-tight">FLAMMES</h1>

                <p className="text-[10px] font-bold tracking-[0.25em] text-orange-500">
                  HOTSPOT
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <p className="mb-4 px-3 text-sm-caps text-gray-600">Management</p>

          <nav className="space-y-2 mb-8">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/";

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20"
                      : "text-gray-400 hover:bg-[#181818] hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* System Status */}
          <div className="mt-auto rounded-2xl glass-effect glass-effect-hover p-4">
            <p className="text-sm-caps text-gray-600">System Status</p>

            <div className="mt-4 flex items-center gap-3">
              <span className="status-dot status-dot-online" />

              <div>
                <span className="text-sm font-semibold">System Online</span>
                <p className="text-xs text-gray-500 leading-tight">
                  Ready for operations
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="min-w-0 flex-1">
          {/* HEADER */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#252525] bg-[#0b0b0b]/95 px-5 py-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="rounded-lg p-2 hover:bg-[#181818] md:hidden transition-colors"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>

              <div>
                <p className="text-[10px] font-bold tracking-widest text-orange-500">
                  ADMIN PANEL
                </p>

                <h2 className="text-lg font-bold">Dashboard</h2>
              </div>
            </div>

            {/* Notifications */}
            <button
              type="button"
              className="relative rounded-xl border border-[#252525] bg-[#111] p-3 hover:bg-[#181818] transition-colors"
              aria-label="Notifications"
            >
              <Bell size={19} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50 animate-pulse-glow" />
            </button>
          </header>

          {/* PAGE CONTENT */}
          <div className="mx-auto max-w-[1500px] p-5 md:p-8">
            {/* HERO SECTION */}
            <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#292929] bg-gradient-to-br from-[#18100b] via-[#101010] to-[#090909] p-6 md:p-8 animate-slide-up">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />

              <div className="relative z-10">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <span className="badge badge-primary">FLAMMES TECH</span>

                  <span className="flex items-center gap-2 text-xs font-medium">
                    <span className="status-dot status-dot-online" />
                    <span className="text-green-400">ONLINE</span>
                  </span>
                </div>

                <h1 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl leading-tight">
                  Your hotspot.
                  <br />

                  <span className="text-gradient">Your network.</span> Your
                  control.
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-400 md:text-base">
                  Manage customers, packages, payments, sessions and connected
                  routers from one powerful platform. Monitor real-time activity
                  and scale your hotspot business effortlessly.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="flames-button">Get Started</button>
                  <button className="flames-button-secondary">
                    View Documentation
                  </button>
                </div>
              </div>
            </section>

            {/* STATS GRID */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.title}
                    className="flames-card group overflow-hidden animate-slide-up"
                    style={{ animationDelay: `${stats.indexOf(stat) * 50}ms` }}
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-3 text-white shadow-lg`}>
                        <Icon size={21} />
                      </div>

                      <span className="text-[10px] font-bold text-green-500 badge badge-success">
                        {stat.badge}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400">{stat.title}</p>

                    <div className="mt-3 flex items-end justify-between">
                      <p className="text-3xl font-black">{stat.value}</p>
                      <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                        <TrendingUp size={14} />
                        {stat.change}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      {stat.description}
                    </p>
                  </div>
                );
              })}
            </section>

            {/* QUICK ACTIONS */}
            <section className="mb-8">
              <div className="mb-5">
                <p className="text-sm-caps text-orange-500">Control Center</p>

                <h2 className="mt-2 text-2xl font-black">Quick Actions</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    href: "/packages",
                    icon: Package,
                    title: "Manage Packages",
                    desc: "Create and manage Wi-Fi plans.",
                  },
                  {
                    href: "/routers",
                    icon: Router,
                    title: "Manage Routers",
                    desc: "Connect and manage network hardware.",
                  },
                  {
                    href: "/customers",
                    icon: Users,
                    title: "View Customers",
                    desc: "Manage hotspot customers.",
                  },
                  {
                    href: "/payments",
                    icon: CreditCard,
                    title: "View Payments",
                    desc: "Monitor hotspot transactions.",
                  },
                ].map((action, idx) => {
                  const ActionIcon = action.icon;
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="flames-card group animate-slide-up hover:-translate-y-2"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="rounded-xl bg-orange-500/10 p-3 w-fit text-orange-500 group-hover:bg-orange-500/20 transition-colors">
                        <ActionIcon size={21} />
                      </div>

                      <h3 className="mt-4 font-bold text-white group-hover:text-orange-400 transition-colors">
                        {action.title}
                      </h3>

                      <p className="mt-2 text-xs text-gray-500">
                        {action.desc}
                      </p>

                      <div className="mt-4 flex items-center justify-between text-xs text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Open</span>
                        <ArrowUpRight size={14} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* LIVE MONITOR & STATUS */}
            <section className="grid gap-4 lg:grid-cols-3">
              {/* Recent Activity */}
              <div className="flames-card lg:col-span-2 animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm-caps text-orange-500">Live Monitor</p>

                    <h2 className="mt-2 text-xl font-black">Recent Activity</h2>
                  </div>

                  <Activity size={21} className="text-orange-500" />
                </div>

                <div className="space-y-3">
                  {recentActivities.map((activity) => {
                    const ActivityIcon = activity.icon;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-4 rounded-xl hover:bg-[#151515] transition-colors border border-transparent hover:border-[#252525]"
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-orange-500/10 p-2.5 text-orange-500">
                            <ActivityIcon size={18} />
                          </div>

                          <div>
                            <p className="text-sm font-medium">
                              {activity.action}
                            </p>
                            <p className="text-xs text-gray-500">
                              {activity.details}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs text-gray-600 whitespace-nowrap ml-4">
                          {activity.time}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button className="flames-button-ghost w-full mt-4">
                  View All Activity
                </button>
              </div>

              {/* Network Status */}
              <div className="flames-card animate-slide-up" style={{ animationDelay: "150ms" }}>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-500 shadow-lg shadow-green-500/20">
                  <ShieldCheck size={24} />
                </div>

                <h2 className="mt-5 text-lg font-black">Network Status</h2>

                <p className="mt-3 text-sm leading-6 text-gray-400">
                  Your FLAMMES HOTSPOT management system is online and ready for
                  operations.
                </p>

                <div className="mt-6 space-y-3 rounded-xl border border-[#252525] bg-black/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Platform</span>
                    <span className="flex items-center gap-2">
                      <span className="status-dot status-dot-online" />
                      <span className="text-sm font-bold text-green-400">
                        ONLINE
                      </span>
                    </span>
                  </div>

                  <div className="divider" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Database</span>
                    <span className="flex items-center gap-2">
                      <span className="status-dot status-dot-online" />
                      <span className="text-sm font-bold text-green-400">
                        READY
                      </span>
                    </span>
                  </div>

                  <div className="divider" />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">API</span>
                    <span className="flex items-center gap-2">
                      <span className="status-dot status-dot-online" />
                      <span className="text-sm font-bold text-green-400">
                        ACTIVE
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="mt-12 border-t border-[#252525] py-6 text-center text-xs text-gray-600">
              © 2026 FLAMMES TECH. All rights reserved. Powered by FLAMMES TECH
              • v1.0.0
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
