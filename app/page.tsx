"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Gauge,
  Globe2,
  LayoutDashboard,
  Menu,
  Package,
  Radio,
  Receipt,
  Router,
  Settings,
  Ticket,
  Users,
  Wifi,
  X,
  UserPlus,
  Boxes,
  HelpCircle,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Packages", href: "/packages", icon: Package, expandable: true },
  { label: "Sessions", href: "/sessions", icon: Activity, expandable: true },
  { label: "Payments", href: "/payments", icon: CreditCard, expandable: true },
  { label: "Routers", href: "/routers", icon: Router, expandable: true },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Notifications", href: "/reports", icon: Bell },
  { label: "Settings", href: "/settings", icon: Settings, expandable: true },
];

const quickLinks = [
  { label: "Add Customer", href: "/customers", icon: UserPlus },
  { label: "Create Package", href: "/packages", icon: Boxes },
  { label: "Generate Voucher", href: "/packages", icon: Ticket },
  { label: "Help & Support", href: "/reports", icon: HelpCircle },
];

const metrics = [
  { title: "Total Routers", value: "0", sub: "Online: 0   •   Offline: 0", icon: Router, tone: "blue", href: "/routers", action: "View Routers" },
  { title: "Active Users", value: "0", sub: "Online: 0   •   Offline: 0", icon: Users, tone: "green", href: "/customers", action: "View Users" },
  { title: "Active Sessions", value: "0", sub: "Expiring Soon: 0", icon: Gauge, tone: "orange", href: "/sessions", action: "View Sessions" },
  { title: "Total Customers", value: "0", sub: "New This Month: 0", icon: Users, tone: "purple", href: "/customers", action: "View Customers" },
  { title: "Hotspot Online Users", value: "0", sub: "Total Connected: 0", icon: Wifi, tone: "cyan", href: "/sessions", action: "View Online Users" },
  { title: "PPPoE Online Users", value: "0", sub: "Connected: 0", icon: Radio, tone: "indigo", href: "/sessions", action: "View PPPoE Users" },
  { title: "Static Online Users", value: "0", sub: "Connected: 0", icon: Globe2, tone: "slate", href: "/sessions", action: "View Static Users" },
  { title: "Total Online Users", value: "0", sub: "Across All Networks", icon: Users, tone: "red", href: "/sessions", action: "View All Users" },
];

const tone: Record<string, string> = {
  blue: "bg-blue-600",
  green: "bg-emerald-500",
  orange: "bg-orange-500",
  purple: "bg-violet-600",
  cyan: "bg-cyan-500",
  indigo: "bg-blue-700",
  slate: "bg-slate-600",
  red: "bg-rose-500",
};

const chartValues = [18, 22, 21, 28, 30, 31, 39, 44, 52, 63, 76, 68];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const payments = [
  ["—", "No customers yet", "—", "KSh 0", "—", "No transactions", "—"],
  ["—", "Connect M-Pesa", "—", "KSh 0", "M-Pesa", "Configure gateway", "—"],
  ["—", "Create a package", "—", "KSh 0", "—", "Waiting for sales", "—"],
  ["—", "Add your first router", "—", "KSh 0", "—", "Network offline", "—"],
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center ${compact ? "justify-center" : "gap-2.5"}`}>
      <Image src="/flammes-tech-logo.svg" alt="FLAMMES TECH" width={compact ? 42 : 178} height={compact ? 34 : 42} className={compact ? "h-9 w-auto object-contain" : "h-10 w-auto object-contain"} priority />
    </div>
  );
}

function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  return (
    <aside className={`${mobile ? "relative h-full w-72" : "fixed inset-y-0 left-0 hidden w-[276px] md:block"} z-40 overflow-y-auto bg-[#0a1422] text-slate-200`}>
      <div className="flex h-[76px] items-center border-b border-slate-800/80 px-5">
        <Logo />
        {mobile && <button onClick={onClose} className="ml-auto rounded-lg p-2 hover:bg-slate-800"><X size={20} /></button>}
      </div>

      <div className="px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/";
            return (
              <Link key={item.label} href={item.href} onClick={onClose} className={`flex h-11 items-center gap-3 rounded-lg px-3.5 text-[13px] font-semibold transition ${active ? "bg-orange-500 text-white shadow-sm" : "text-slate-300 hover:bg-slate-800/90 hover:text-white"}`}>
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
                {item.expandable && <ChevronRight size={15} className="ml-auto opacity-70" />}
              </Link>
            );
          })}
        </nav>

        <div className="my-5 border-t border-slate-800" />
        <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Quick Links</div>
        <div className="mt-2 space-y-1">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return <Link key={item.label} href={item.href} onClick={onClose} className="flex h-10 items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white"><Icon size={17} />{item.label}</Link>;
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 bg-[#09111d] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white"><Wifi size={20} /></div>
          <div><div className="text-sm font-bold text-white">FLAMMES HOTSPOT</div><div className="text-[10px] text-slate-400">Fast • Reliable • Secure</div></div>
        </div>
      </div>
    </aside>
  );
}

export default function Dashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900">
      <Sidebar />
      {mobileOpen && <div className="fixed inset-0 z-50 md:hidden"><button className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} aria-label="Close sidebar" /><Sidebar mobile onClose={() => setMobileOpen(false)} /></div>}

      <div className="md:pl-[276px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center border-b border-slate-200 bg-[#0b1726] px-4 text-white shadow-sm md:px-6">
          <button onClick={() => setMobileOpen(true)} className="mr-3 rounded-lg p-2 hover:bg-slate-800 md:hidden" aria-label="Open menu"><Menu size={21} /></button>
          <div className="hidden items-center gap-2 md:flex"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">System Online</span></div>
          <div className="ml-auto flex items-center gap-4">
            <button className="relative rounded-lg p-2 text-slate-300 hover:bg-slate-800" aria-label="Notifications"><Bell size={19}/><span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">0</span></button>
            <div className="hidden items-center gap-2 border-l border-slate-700 pl-4 sm:flex"><Wifi size={16} className="text-cyan-400" /><span className="text-xs text-slate-300">Network:</span><span className="text-xs font-bold">FLAMMES HOTSPOT</span><ChevronDown size={14}/></div>
            <div className="flex items-center gap-2 border-l border-slate-700 pl-4"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 font-bold">A</div><div className="hidden sm:block"><div className="text-xs font-bold">Admin</div><div className="text-[9px] text-slate-400">Super Administrator</div></div><ChevronDown size={14}/></div>
          </div>
        </header>

        <main className="p-4 md:p-6 lg:p-7">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><h1 className="text-[27px] font-extrabold tracking-tight text-slate-900">Dashboard</h1><p className="mt-1 text-[13px] text-slate-500">Welcome back, Admin! Here's what's happening with your hotspot system.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-xs text-slate-600"><CalendarDays size={18}/><span>Tue, 16 Sep 2026<br/><b>20:42</b></span></div>
              <div className="hidden h-10 w-px bg-slate-200 sm:block" />
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Router View<select className="mt-1 block h-10 min-w-[240px] rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-blue-500"><option>All Routers - System Wide</option></select></label>
            </div>
          </div>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => { const Icon = metric.icon; return <Link key={metric.title} href={metric.href} className={`${tone[metric.tone]} group min-h-[125px] rounded-lg p-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}><div className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15"><Icon size={25}/></div><div className="min-w-0"><div className="text-xs font-semibold opacity-95">{metric.title}</div><div className="mt-1 text-[28px] font-extrabold leading-none">{metric.value}</div><div className="mt-2 whitespace-pre-line text-[10px] opacity-90">{metric.sub}</div></div></div><div className="mt-3 text-[11px] font-bold">{metric.action} <span className="inline-block transition group-hover:translate-x-1">→</span></div></Link>; })}
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,.95fr)]">
            <div className="space-y-5">
              <section className="flames-card overflow-hidden">
                <div className="flex h-12 items-center justify-between bg-blue-600 px-4 text-white"><div className="flex items-center gap-2 text-sm font-bold"><BarChart3 size={18}/>Monthly Registered Customers</div><div className="flex gap-1"><button className="rounded bg-white/15 px-2 py-1 text-sm hover:bg-white/25">−</button><button className="rounded bg-white/15 px-2 py-1 text-sm hover:bg-white/25">↗</button></div></div>
                <div className="p-4 md:p-5"><div className="mb-3 flex items-center justify-center gap-2 text-[11px] text-slate-500"><span className="h-2.5 w-8 rounded-sm bg-blue-500"/>Registered Members</div><div className="relative h-52 border-b border-l border-slate-200 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_40px,#e8edf3_41px)]"><div className="absolute inset-x-4 bottom-0 flex h-full items-end justify-between gap-2">{chartValues.map((v, i) => <div key={months[i]} className="flex h-full w-full flex-col justify-end"><div className="mx-auto w-full max-w-7 rounded-t bg-blue-500/80" style={{height:`${v}%`}} /></div>)}</div></div><div className="mt-2 flex justify-between px-1 text-[10px] text-slate-400">{months.map(m=><span key={m}>{m}</span>)}</div></div>
              </section>

              <section className="flames-card overflow-hidden">
                <div className="flex h-12 items-center justify-between bg-blue-600 px-4 text-white"><div className="flex items-center gap-2 text-sm font-bold"><Receipt size={17}/>Recent Payments</div><Link href="/payments" className="text-xs font-semibold hover:underline">View All →</Link></div>
                <div className="overflow-x-auto"><table className="admin-table min-w-[720px]"><thead><tr><th>#</th><th>Customer</th><th>Package</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr></thead><tbody>{payments.map((row, i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{j===5 ? <span className={`badge ${i===1 ? "badge-warning" : "badge-success"}`}>{cell}</span> : cell}</td>)}</tr>)}</tbody></table></div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="flames-card overflow-hidden"><div className="flex h-12 items-center justify-between bg-blue-600 px-4 text-white"><div className="flex items-center gap-2 text-sm font-bold"><CreditCard size={17}/>Payment Gateway</div><span className="badge bg-emerald-500 text-white">● M-Pesa Connected</span></div><div className="p-4"><div className="flex items-center gap-4"><div className="text-xl font-extrabold text-emerald-600">M-PESA</div><div className="h-12 w-px bg-slate-200"/><div className="flex-1 space-y-1 text-[11px]"><div><span className="text-slate-500">Status</span><b className="ml-5 text-emerald-600">● Active</b></div><div><span className="text-slate-500">Merchant ID</span><b className="ml-2">Not configured</b></div><div><span className="text-slate-500">Transaction Fee</span><b className="ml-2">—</b></div></div></div><Link href="/payments" className="mt-4 inline-flex rounded-md bg-orange-500 px-3 py-2 text-[11px] font-bold text-white hover:bg-orange-600">View Transactions →</Link></div></section>

              <section className="flames-card overflow-hidden"><div className="flex h-12 items-center gap-2 bg-blue-600 px-4 text-sm font-bold text-white"><Users size={17}/>User Insights</div><div className="p-4"><div className="flex items-center gap-4"><div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full" style={{background:"conic-gradient(#2563eb 0deg 280deg,#dbeafe 280deg 360deg)"}}><div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-lg font-extrabold text-slate-700">0%</div></div><div className="flex-1 space-y-2 text-[11px]"><div className="flex justify-between"><span className="text-emerald-600">● Active Users</span><b>0</b></div><div className="flex justify-between"><span className="text-orange-500">● Inactive Users</span><b>0</b></div><div className="flex justify-between"><span className="text-blue-600">● New Users (7 days)</span><b>0</b></div><div className="flex justify-between"><span className="text-slate-400">● Total Users</span><b>0</b></div></div></div><Link href="/reports" className="mt-4 block text-right text-[11px] font-bold text-blue-600">View Analytics →</Link></div></section>

              <section className="flames-card overflow-hidden"><div className="flex h-12 items-center justify-between bg-orange-500 px-4 text-white"><div className="flex items-center gap-2 text-sm font-bold"><Activity size={17}/>Quick Actions</div><span className="text-xs font-semibold">View All →</span></div><div className="grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-4 sm:divide-y-0">{[[UserPlus,"Add Customer","/customers"],[Package,"Create Package","/packages"],[Ticket,"Generate Voucher","/packages"],[BarChart3,"View Reports","/reports"]].map(([Icon,label,href])=>{const I=Icon as typeof UserPlus;return <Link key={label as string} href={href as string} className="flex min-h-[92px] flex-col items-center justify-center gap-2 p-3 text-center hover:bg-orange-50"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-blue-600"><I size={18}/></span><span className="text-[11px] font-bold text-slate-700">{label as string}</span></Link>})}</div></section>
            </div>
          </section>

          <footer className="mt-6 flex flex-col gap-2 border-t border-slate-200 py-4 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><Image src="/flammes-tech-logo.svg" alt="FLAMMES TECH" width={110} height={25} className="h-6 w-auto object-contain opacity-70"/><span>FLAMMES HOTSPOT</span><span>•</span><span>Powered by FLAMMES TECH</span></div><span>© 2026 FLAMMES TECH. All rights reserved.</span></footer>
        </main>
      </div>
    </div>
  );
}
