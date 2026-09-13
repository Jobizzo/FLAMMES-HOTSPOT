"use client";

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
} from "lucide-react";

const stats = [
  {
    title: "Active Users",
    value: "0",
    icon: Users,
    description: "Currently connected",
  },
  {
    title: "Today's Revenue",
    value: "KES 0",
    icon: CircleDollarSign,
    description: "Today's hotspot sales",
  },
  {
    title: "Online Sessions",
    value: "0",
    icon: Activity,
    description: "Active sessions",
  },
  {
    title: "Connected Routers",
    value: "0",
    icon: Router,
    description: "Routers online",
  },
];

const menuItems = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Customers", icon: Users },
  { name: "Packages", icon: Package },
  { name: "Sessions", icon: Wifi },
  { name: "Payments", icon: CreditCard },
  { name: "Routers", icon: Router },
  { name: "Reports", icon: BarChart3 },
  { name: "Settings", icon: Settings },
];

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r border-[#252525] bg-[#0b0b0b] p-5 md:block">
          <div className="mb-10">
            <h1 className="text-2xl font-black tracking-tight">
              FLAMMES<span className="text-orange-500">🔥</span>
            </h1>
            <p className="mt-1 text-xs text-gray-500">HOTSPOT</p>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.name}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                    index === 0
                      ? "bg-orange-500 text-black"
                      : "text-gray-400 hover:bg-[#181818] hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {item.name}
                </button>
              );
            })}
          </nav>

          <div className="mt-10 rounded-2xl border border-[#252525] bg-[#111] p-4">
            <p className="text-xs text-gray-500">SYSTEM STATUS</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-sm">System Online</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <section className="flex-1">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-[#252525] bg-[#0b0b0b] px-5 py-4 md:px-8">
            <div className="flex items-center gap-3">
              <button className="rounded-lg p-2 hover:bg-[#181818] md:hidden">
                <Menu size={22} />
              </button>

              <div>
                <p className="text-xs text-gray-500">ADMIN PANEL</p>
                <h2 className="text-lg font-bold">Dashboard</h2>
              </div>
            </div>

            <button className="rounded-xl border border-[#252525] bg-[#111] p-3 hover:bg-[#181818]">
              <Bell size={19} />
            </button>
          </header>

          <div className="p-5 md:p-8">
            {/* Welcome */}
            <div className="mb-8">
              <p className="text-sm text-orange-500">WELCOME BACK 👋</p>
              <h3 className="mt-1 text-3xl font-black md:text-4xl">
                FLAMMES HOTSPOT
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Manage your hotspot network from one powerful dashboard.
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.title}
                    className="rounded-2xl border border-[#252525] bg-[#111] p-5"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="rounded-xl bg-orange-500/10 p-3 text-orange-500">
                        <Icon size={21} />
                      </div>
                      <span className="text-xs text-green-500">LIVE</span>
                    </div>

                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="mt-1 text-2xl font-black">{stat.value}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      {stat.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-8">
              <h4 className="mb-4 text-lg font-bold">Quick Actions</h4>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Add Package", Package],
                  ["Add Router", Router],
                  ["View Customers", Users],
                  ["View Payments", CreditCard],
                ].map(([name, Icon]) => {
                  const ActionIcon = Icon as typeof Package;

                  return (
                    <button
                      key={name as string}
                      className="flex items-center gap-3 rounded-2xl border border-[#252525] bg-[#111] p-5 text-left transition hover:border-orange-500/50 hover:bg-[#151515]"
                    >
                      <ActionIcon className="text-orange-500" size={21} />
                      <span className="text-sm font-semibold">
                        {name as string}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8 rounded-2xl border border-[#252525] bg-[#111] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold">Recent Activity</h4>
                  <p className="mt-1 text-xs text-gray-500">
                    Your latest hotspot activity will appear here.
                  </p>
                </div>

                <Activity className="text-orange-500" size={21} />
              </div>

              <div className="mt-8 flex min-h-32 items-center justify-center rounded-xl border border-dashed border-[#292929]">
                <p className="text-sm text-gray-600">
                  No activity yet
                </p>
              </div>
            </div>

            <footer className="mt-10 border-t border-[#252525] pt-6 text-center text-xs text-gray-600">
              © 2026 FLAMMES TECH. All rights reserved.
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
  }
