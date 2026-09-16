"use client";

import { useEffect, useState } from "react";
import { Package, Plus, Clock } from "lucide-react";

interface HotspotPackage { id: string; name: string; price: number; durationMinutes: number; active: boolean; }

export default function PackagesPage() {
  const [packages, setPackages] = useState<HotspotPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", price: "", durationMinutes: "" });

  useEffect(() => { fetchPackages(); }, []);
  const fetchPackages = async () => {
    try { const res = await fetch("/api/packages"); const data = await res.json(); if (data.success) setPackages(data.data.packages); }
    catch (error) { console.error("Failed to fetch packages", error); }
    finally { setLoading(false); }
  };
  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, price: parseFloat(formData.price), durationMinutes: parseInt(formData.durationMinutes) }) });
      const data = await res.json();
      if (data.success) { setPackages([...packages, data.data]); setFormData({ name: "", price: "", durationMinutes: "" }); setShowModal(false); }
    } catch (error) { console.error("Failed to add package", error); }
  };

  return <main className="admin-light min-h-screen">
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-[#252525] bg-[#0b0b0b]/95 px-5 py-4 sm:px-8"><div className="flex items-center justify-between gap-4"><div><p className="text-sm-caps text-orange-500">Management</p><h1 className="text-2xl font-black text-white">WiFi Packages</h1></div><button onClick={() => setShowModal(true)} className="flames-button flex items-center gap-2"><Plus size={18}/>Add Package</button></div></header>
      <div className="flex-1 px-5 py-6 sm:px-8">
        {loading ? <div className="flex justify-center py-12"><p className="text-gray-500">Loading packages...</p></div> : packages.length === 0 ? <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#292929] bg-white py-16"><Package size={32} className="mb-3 text-orange-500"/><p className="font-medium text-gray-500">No packages yet</p><p className="mt-1 text-sm text-gray-600">Create your first WiFi package to get started</p><button onClick={() => setShowModal(true)} className="flames-button mt-4">Add Package</button></div> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{packages.map((pkg) => <div key={pkg.id} className="flames-card flex flex-col"><div className="mb-4 flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><Package size={20}/></div><span className={`badge ${pkg.active ? "badge-success" : "badge-warning"}`}>{pkg.active ? "Active" : "Inactive"}</span></div><h3 className="mb-1 text-lg font-bold text-slate-900">{pkg.name}</h3><p className="mb-4 text-2xl font-black text-orange-600">KES {pkg.price.toLocaleString()}</p><div className="mb-5 flex items-center gap-2 text-sm text-slate-600"><Clock size={16}/>{pkg.durationMinutes < 60 ? `${pkg.durationMinutes} minutes` : `${Math.floor(pkg.durationMinutes / 60)} hours`}</div><div className="mt-auto flex gap-2"><button className="flames-button-secondary flex-1">Edit</button><button className="flames-button-ghost flex-1">Delete</button></div></div>)}</div>}
      </div>
    </div>
    {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><div className="flames-card w-full max-w-md"><h2 className="mb-4 text-xl font-black text-slate-900">Add WiFi Package</h2><form onSubmit={handleAddPackage} className="space-y-4"><div><label className="mb-2 block text-sm font-medium text-slate-600">Package Name</label><input type="text" required value={formData.name} onChange={(e)=>setFormData({...formData,name:e.target.value})} className="flames-input" placeholder="30-Minute Pass"/></div><div><label className="mb-2 block text-sm font-medium text-slate-600">Price (KES)</label><input type="number" required value={formData.price} onChange={(e)=>setFormData({...formData,price:e.target.value})} className="flames-input" placeholder="50" min="0"/></div><div><label className="mb-2 block text-sm font-medium text-slate-600">Duration (Minutes)</label><input type="number" required value={formData.durationMinutes} onChange={(e)=>setFormData({...formData,durationMinutes:e.target.value})} className="flames-input" placeholder="30" min="1"/></div><div className="flex gap-3 pt-4"><button type="button" onClick={()=>setShowModal(false)} className="flames-button-secondary flex-1">Cancel</button><button type="submit" className="flames-button flex-1">Add Package</button></div></form></div></div>}
  </main>;
}
