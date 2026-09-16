"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, Search, MoreVertical, Phone, Mail, LayoutDashboard, Package, Activity, CreditCard, Router, BarChart3, Settings, Wifi, Menu, X } from "lucide-react";

interface Customer { id: string; name: string; phone: string; email?: string; status: "active" | "inactive" | "expired"; createdAt: string; }

const nav = [
  ["Dashboard", "/", LayoutDashboard], ["Customers", "/customers", Users], ["Packages", "/packages", Package],
  ["Sessions", "/sessions", Activity], ["Payments", "/payments", CreditCard], ["Routers", "/routers", Router],
  ["Reports", "/reports", BarChart3], ["Settings", "/settings", Settings],
] as const;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try { const res = await fetch("/api/customers"); const data = await res.json(); if (data.success) setCustomers(data.data.customers); }
    catch (error) { console.error("Failed to fetch customers", error); }
    finally { setLoading(false); }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.success) { setCustomers([...customers, data.data]); setFormData({ name: "", phone: "", email: "" }); setShowModal(false); }
    } catch (error) { console.error("Failed to add customer", error); }
  };

  const filtered = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] bg-[#0a1422] text-slate-200 md:block">
        <div className="flex h-[76px] items-center border-b border-slate-800 px-5"><img src="/flammes-tech-logo.svg" alt="FLAMMES TECH" className="h-10 w-auto" /></div>
        <nav className="space-y-1 p-3">
          {nav.map(([label, href, Icon]) => <Link key={label} href={href} className={`flex h-11 items-center gap-3 rounded-md px-3 text-[13px] font-semibold ${label === "Customers" ? "bg-orange-500 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}><Icon size={18}/>{label}</Link>)}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-slate-800 bg-[#09111d] p-4"><div className="flex items-center gap-3"><div className="rounded-full bg-orange-500 p-2 text-white"><Wifi size={17}/></div><div><div className="text-xs font-bold text-white">FLAMMES HOTSPOT</div><div className="text-[10px] text-slate-400">Network Management</div></div></div></div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-50 bg-black/50 md:hidden"><aside className="h-full w-72 bg-[#0a1422] p-4 text-white"><button onClick={() => setMobileOpen(false)} className="mb-5 ml-auto block"><X/></button>{nav.map(([label, href, Icon]) => <Link key={label} href={href} onClick={() => setMobileOpen(false)} className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm ${label === "Customers" ? "bg-orange-500" : "text-slate-300"}`}><Icon size={18}/>{label}</Link>)}</aside></div>}

      <div className="md:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[68px] items-center border-b border-slate-200 bg-[#0b1726] px-4 text-white shadow-sm md:px-6">
          <button onClick={() => setMobileOpen(true)} className="mr-3 md:hidden"><Menu size={21}/></button>
          <div><div className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Management</div><div className="text-sm font-bold">Customer Management</div></div>
          <div className="ml-auto flex items-center gap-3 text-xs"><span className="hidden text-emerald-300 sm:inline">● System Online</span><span className="border-l border-slate-700 pl-3">Admin</span></div>
        </header>

        <main className="p-4 md:p-6 lg:p-7">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><h1 className="text-2xl font-extrabold tracking-tight">Customers</h1><p className="mt-1 text-sm text-slate-500">Manage registered subscribers and their network access.</p></div>
            <button onClick={() => setShowModal(true)} className="flames-button flex w-fit items-center gap-2"><Plus size={17}/> Add Customer</button>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flames-card p-4"><div className="text-xs font-semibold text-slate-500">Total Customers</div><div className="mt-1 text-2xl font-extrabold">{customers.length}</div></div>
            <div className="flames-card p-4"><div className="text-xs font-semibold text-slate-500">Active Customers</div><div className="mt-1 text-2xl font-extrabold text-emerald-600">{customers.filter(c => c.status === "active").length}</div></div>
            <div className="flames-card p-4"><div className="text-xs font-semibold text-slate-500">Expired / Inactive</div><div className="mt-1 text-2xl font-extrabold text-slate-600">{customers.filter(c => c.status !== "active").length}</div></div>
          </div>

          <section className="flames-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-sm font-bold"><Users size={17} className="text-orange-500"/> Registered Customers</div><div className="relative w-full sm:max-w-xs"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search name or phone..." className="flames-input pl-9"/></div></div>
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[760px]"><thead><tr><th>Customer</th><th>Phone</th><th>Email</th><th>Status</th><th>Registered</th><th>Action</th></tr></thead>
                <tbody>{loading ? <tr><td colSpan={6} className="py-12 text-center text-slate-500">Loading customers...</td></tr> : filtered.length === 0 ? <tr><td colSpan={6} className="py-14 text-center"><Users className="mx-auto mb-2 text-slate-300" size={30}/><div className="font-semibold text-slate-600">No customers found</div><div className="mt-1 text-xs text-slate-400">Add your first customer to begin managing network access.</div></td></tr> : filtered.map(c => <tr key={c.id}><td className="font-semibold">{c.name}</td><td><span className="inline-flex items-center gap-1"><Phone size={13}/>{c.phone}</span></td><td>{c.email ? <span className="inline-flex items-center gap-1"><Mail size={13}/>{c.email}</span> : "—"}</td><td><span className={`badge ${c.status === "active" ? "badge-success" : c.status === "expired" ? "badge-danger" : "badge-warning"}`}>{c.status}</span></td><td>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</td><td><button className="rounded-md p-2 hover:bg-slate-100"><MoreVertical size={17}/></button></td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <footer className="mt-8 border-t border-slate-200 py-5 text-center text-[11px] text-slate-500">© 2026 FLAMMES TECH. All rights reserved. Powered by FLAMMES TECH</footer>
        </main>
      </div>

      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="flames-card w-full max-w-md p-6"><div className="mb-5 flex items-center justify-between"><div><div className="text-xs font-bold uppercase tracking-wide text-orange-500">Customer Management</div><h2 className="text-xl font-extrabold">Add Customer</h2></div><button onClick={() => setShowModal(false)}><X size={20}/></button></div><form onSubmit={handleAddCustomer} className="space-y-4"><input required value={formData.name} onChange={e => setFormData({...formData,name:e.target.value})} className="flames-input" placeholder="Customer name"/><input required type="tel" value={formData.phone} onChange={e => setFormData({...formData,phone:e.target.value})} className="flames-input" placeholder="Phone number"/><input type="email" value={formData.email} onChange={e => setFormData({...formData,email:e.target.value})} className="flames-input" placeholder="Email (optional)"/><div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowModal(false)} className="flames-button-secondary flex-1">Cancel</button><button type="submit" className="flames-button flex-1">Add Customer</button></div></form></div></div>}
    </div>
  );
}
