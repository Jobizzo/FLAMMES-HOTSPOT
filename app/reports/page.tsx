"use client";

import { BarChart3, Users, DollarSign, Wifi, Download } from "lucide-react";

const stats = [
  { label: "Total Customers", value: "0", icon: Users, tone: "orange" },
  { label: "Total Revenue", value: "KES 0", icon: DollarSign, tone: "green" },
  { label: "Active Sessions", value: "0", icon: Wifi, tone: "blue" },
  { label: "Conversion Rate", value: "0%", icon: BarChart3, tone: "orange" },
];

export default function ReportsPage() {
  return <main className="admin-light min-h-screen"><div className="flex min-h-screen flex-col">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-5 py-4 sm:px-8"><div className="flex items-center justify-between gap-4"><div><p className="text-sm-caps text-orange-600">Analytics</p><h1 className="text-2xl font-black text-slate-900">Reports</h1><p className="mt-1 text-sm text-slate-500">Operational and financial performance at a glance.</p></div><button className="flames-button-secondary flex items-center gap-2"><Download size={16}/>Export</button></div></header>
    <div className="flex-1 px-5 py-6 sm:px-8"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat)=>{const Icon=stat.icon; const iconClass=stat.tone === "green" ? "bg-green-50 text-green-600" : stat.tone === "blue" ? "bg-sky-50 text-sky-600" : "bg-orange-50 text-orange-600"; return <div key={stat.label} className="flames-card"><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}><Icon size={20}/></div><p className="mt-4 text-sm text-slate-500">{stat.label}</p><p className="mt-1 text-2xl font-black text-slate-900">{stat.value}</p></div>})}</div>
      <div className="mt-6 grid gap-5 lg:grid-cols-3"><section className="flames-card lg:col-span-2"><div className="flex items-start justify-between"><div><p className="text-sm-caps text-orange-600">Performance</p><h2 className="mt-2 text-lg font-black text-slate-900">Revenue & Usage</h2></div><span className="badge badge-primary">Live data</span></div><div className="mt-6 flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50"><div className="text-center"><BarChart3 size={34} className="mx-auto mb-3 text-slate-400"/><p className="font-semibold text-slate-600">Analytics will appear here</p><p className="mt-1 text-sm text-slate-500">Connect live transaction and session data to populate this report.</p></div></div></section>
      <section className="flames-card"><p className="text-sm-caps text-orange-600">Report scope</p><h2 className="mt-2 text-lg font-black text-slate-900">Network overview</h2><div className="mt-5 space-y-4 text-sm"><div className="flex items-center justify-between"><span className="text-slate-500">Customers</span><span className="font-semibold text-slate-900">0</span></div><div className="divider"/><div className="flex items-center justify-between"><span className="text-slate-500">Sessions</span><span className="font-semibold text-slate-900">0</span></div><div className="divider"/><div className="flex items-center justify-between"><span className="text-slate-500">Revenue</span><span className="font-semibold text-slate-900">KES 0</span></div><div className="divider"/><div className="flex items-center justify-between"><span className="text-slate-500">Routers</span><span className="font-semibold text-slate-900">0</span></div></div></section></div>
    </div></div></main>;
}
