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
} from "lucide-react";

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
    description: "Currently connected",
    icon: Users,
  },
  {
    title: "Today's Revenue",
    value: "KES 0",
    description: "Hotspot sales today",
    icon: CircleDollarSign,
  },
  {
    title: "Online Sessions",
    value: "0",
    description: "Active sessions",
    icon: Activity,
  },
  {
    title: "Connected Routers",
    value: "0",
    description: "Routers online",
    icon: Router,
  },
];

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-[#252525] bg-[#0b0b0b] p-5 md:block">

          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-xl">
                🔥
              </div>

              <div>
                <h1 className="text-lg font-black">
                  FLAMMES
                </h1>

                <p className="text-[10px] font-bold tracking-[0.25em] text-gray-500">
                  HOTSPOT
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.2em] text-gray-600">
            MANAGEMENT
          </p>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/";

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-orange-500 text-black"
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
          <div className="mt-10 rounded-2xl border border-[#252525] bg-[#111] p-4">
            <p className="text-[10px] font-bold tracking-wider text-gray-600">
              SYSTEM STATUS
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

              <span className="text-sm font-medium">
                System Online
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-gray-600">
              FLAMMES HOTSPOT is ready for network management.
            </p>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="min-w-0 flex-1">

          {/* HEADER */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#252525] bg-[#0b0b0b]/95 px-5 py-4 backdrop-blur md:px-8">

            <div className="flex items-center gap-3">

              {/* Mobile Menu */}
              <button
                type="button"
                className="rounded-lg p-2 hover:bg-[#181818] md:hidden"
                aria-label="Open menu"
              >
                <Menu size={22} />
              </button>

              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-orange-500">
                  ADMIN PANEL
                </p>

                <h2 className="text-lg font-bold">
                  Dashboard
                </h2>
              </div>
            </div>

            {/* Notifications */}
            <button
              type="button"
              className="relative rounded-xl border border-[#252525] bg-[#111] p-3 hover:bg-[#181818]"
              aria-label="Notifications"
            >
              <Bell size={19} />

              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-500" />
            </button>
          </header>

          {/* PAGE */}
          <div className="mx-auto max-w-[1500px] p-5 md:p-8">

            {/* HERO */}
            <section className="relative mb-8 overflow-hidden rounded-3xl border border-[#292929] bg-gradient-to-br from-[#18100b] via-[#101010] to-[#090909] p-6 md:p-8">

              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />

              <div className="relative">

                <div className="mb-4 flex flex-wrap items-center gap-3">

                  <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-[10px] font-bold tracking-wider text-orange-400">
                    FLAMMES TECH
                  </span>

                  <span className="flex items-center gap-2 text-xs text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    ONLINE
                  </span>

                </div>

                <h1 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                  Your hotspot.
                  <br />

                  <span className="text-orange-500">
                    Your network.
                  </span>{" "}
                  Your control.
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-500 md:text-base">
                  Manage customers, packages, payments, sessions
                  and connected routers from one powerful platform.
                </p>

              </div>
            </section>

            {/* STATS */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.title}
                    className="rounded-2xl border border-[#252525] bg-[#111] p-5 transition hover:-translate-y-1 hover:border-orange-500/30"
                  >

                    <div className="mb-5 flex items-center justify-between">

                      <div className="rounded-xl bg-orange-500/10 p-3 text-orange-500">
                        <Icon size={21} />
                      </div>

                      <span className="text-[10px] font-bold text-green-500">
                        LIVE
                      </span>

                    </div>

                    <p className="text-sm text-gray-500">
                      {stat.title}
                    </p>

                    <p className="mt-1 text-2xl font-black">
                      {stat.value}
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      {stat.description}
                    </p>

                  </div>
                );
              })}

            </section>

            {/* QUICK ACTIONS */}
            <section className="mt-8">

              <div className="mb-4">
                <p className="text-[10px] font-bold tracking-[0.2em] text-orange-500">
                  CONTROL CENTER
                </p>

                <h2 className="mt-1 text-xl font-black">
                  Quick Actions
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                <Link
                  href="/packages"
                  className="group rounded-2xl border border-[#252525] bg-[#111] p-5 transition hover:border-orange-500/50 hover:bg-[#151515]"
                >
                  <Package
                    size={21}
                    className="text-orange-500"
                  />

                  <h3 className="mt-4 font-bold">
                    Manage Packages
                  </h3>

                  <p className="mt-1 text-xs text-gray-600">
                    Create and manage Wi-Fi plans.
                  </p>
                </Link>

                <Link
                  href="/routers"
                  className="group rounded-2xl border border-[#252525] bg-[#111] p-5 transition hover:border-orange-500/50 hover:bg-[#151515]"
                >
                  <Router
                    size={21}
                    className="text-orange-500"
                  />

                  <h3 className="mt-4 font-bold">
                    Manage Routers
                  </h3>

                  <p className="mt-1 text-xs text-gray-600">
                    Connect and manage network hardware.
                  </p>
                </Link>

                <Link
                  href="/customers"
                  className="group rounded-2xl border border-[#252525] bg-[#111] p-5 transition hover:border-orange-500/50 hover:bg-[#151515]"
                >
                  <Users
                    size={21}
                    className="text-orange-500"
                  />

                  <h3 className="mt-4 font-bold">
                    View Customers
                  </h3>

                  <p className="mt-1 text-xs text-gray-600">
                    Manage hotspot customers.
                  </p>
                </Link>

                <Link
                  href="/payments"
                  className="group rounded-2xl border border-[#252525] bg-[#111] p-5 transition hover:border-orange-500/50 hover:bg-[#151515]"
                >
                  <CreditCard
                    size={21}
                    className="text-orange-500"
                  />

                  <h3 className="mt-4 font-bold">
                    View Payments
                  </h3>

                  <p className="mt-1 text-xs text-gray-600">
                    Monitor hotspot transactions.
                  </p>
                </Link>

              </div>
            </section>

            {/* LIVE MONITOR */}
            <section className="mt-8 grid gap-4 lg:grid-cols-3">

              <div className="rounded-2xl border border-[#252525] bg-[#111] p-6 lg:col-span-2">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-[10px] font-bold tracking-[0.2em] text-orange-500">
                      LIVE MONITOR
                    </p>

                    <h2 className="mt-1 text-lg font-black">
                      Recent Activity
                    </h2>
                  </div>

                  <Activity
                    size={21}
                    className="text-orange-500"
                  />

                </div>

                <div className="mt-6 flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-[#292929]">

                  <div className="text-center">

                    <Activity
                      size={25}
                      className="mx-auto text-gray-700"
                    />

                    <p className="mt-3 text-sm font-medium text-gray-500">
                      No activity yet
                    </p>

                    <p className="mt-1 text-xs text-gray-700">
                      Network activity will appear here.
                    </p>

                  </div>

                </div>

              </div>

              {/* NETWORK STATUS */}
              <div className="rounded-2xl border border-[#252525] bg-[#111] p-6">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                  <ShieldCheck size={21} />
                </div>

                <h2 className="mt-5 font-black">
                  Network Status
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Your FLAMMES HOTSPOT management system
                  is online and ready.
                </p>

                <div className="mt-6 rounded-xl border border-[#292929] bg-black/20 p-4">

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Platform
                    </span>

                    <span className="text-xs font-bold text-green-500">
                      ONLINE
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Database
                    </span>

                    <span className="text-xs font-bold text-orange-500">
                      READY
                    </span>
                  </div>

                </div>

              </div>

            </section>

            {/* FOOTER */}
            <footer className="mt-12 border-t border-[#252525] py-6 text-center text-xs text-gray-700">
              © 2026 FLAMMES TECH. All rights reserved. Powered by FLAMMES TECH.
            </footer>

          </div>
        </section>
      </div>
    </main>
  );
}
