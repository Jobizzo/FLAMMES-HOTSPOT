"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, Plus, Clock3, Search, MoreHorizontal, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface HotspotPackage {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  active: boolean;
}

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<HotspotPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ name: "", price: "", durationMinutes: "" });

  useEffect(() => { fetchPackages(); }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/packages");
      const data = await res.json();
      if (data.success) setPackages(data.data.packages);
    } catch (error) {
      console.error("Failed to fetch packages", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, price: parseFloat(formData.price), durationMinutes: parseInt(formData.durationMinutes) }),
      });
      const data = await res.json();
      if (data.success) {
        setPackages((current) => [...current, data.data]);
        setFormData({ name: "", price: "", durationMinutes: "" });
        setShowModal(false);
      }
    } catch (error) {
      console.error("Failed to add package", error);
    }
  };

  const filtered = useMemo(() => packages.filter((pkg) => pkg.name.toLowerCase().includes(search.toLowerCase())), [packages, search]);
  const activeCount = packages.filter((pkg) => pkg.active).length;
  const averagePrice = packages.length ? packages.reduce((sum, pkg) => sum + Number(pkg.price), 0) / packages.length : 0;

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#111827]">
      <div className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-[#e5e7eb] bg-white px-4 py-4 shadow-sm sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f97316]">Management / Packages</p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111827]">WiFi Packages</h1>
              <p className="mt-1 text-sm text-[#6b7280]">Configure customer access plans, pricing and connection duration.</p>
            </div>
            <button onClick={() => setShowModal(true)} className="flames-button flex items-center justify-center gap-2">
              <Plus size={18} /> Create Package
            </button>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Total Packages", packages.length, "All configured plans"],
              ["Active Packages", activeCount, "Available for purchase"],
              ["Inactive Packages", packages.length - activeCount, "Currently disabled"],
              ["Average Price", `KES ${averagePrice.toFixed(0)}`, "Across all packages"],
            ].map(([label, value, note]) => (
              <div key={String(label)} className="flames-card border-l-4 border-l-[#f97316] bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-[#6b7280]">{label}</p>
                <p className="mt-2 text-2xl font-extrabold text-[#111827]">{value}</p>
                <p className="mt-1 text-xs text-[#9ca3af]">{note}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-[#111827]">Package Catalogue</h2>
              <p className="text-xs text-[#6b7280]">Plans shown here can be used by the captive portal and voucher system.</p>
            </div>
            <div className="relative w-full md:max-w-xs">
              <Search size={17} className="absolute left-3 top-3 text-[#9ca3af]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search packages..." className="flames-input bg-white pl-10" />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="admin-table min-w-[760px] w-full">
                <thead>
                  <tr>
                    <th>Package</th><th>Price</th><th>Duration</th><th>Status</th><th>Access</th><th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="py-12 text-center text-[#6b7280]">Loading packages...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="py-14 text-center"><Package className="mx-auto mb-2 text-[#9ca3af]" size={30} /><p className="font-semibold text-[#374151]">No packages found</p><p className="mt-1 text-sm text-[#9ca3af]">Create a package to make an access plan available.</p></td></tr>
                  ) : filtered.map((pkg) => (
                    <tr key={pkg.id}>
                      <td><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-[#f97316]"><Package size={18} /></span><div><p className="font-bold text-[#111827]">{pkg.name}</p><p className="text-xs text-[#9ca3af]">ID: {pkg.id.slice(0, 8)}</p></div></div></td>
                      <td><span className="font-bold text-[#111827]">KES {Number(pkg.price).toFixed(0)}</span></td>
                      <td><span className="flex items-center gap-2 text-sm text-[#4b5563]"><Clock3 size={15} />{formatDuration(pkg.durationMinutes)}</span></td>
                      <td><span className={`badge ${pkg.active ? "badge-success" : "badge-danger"}`}>{pkg.active ? "Active" : "Inactive"}</span></td>
                      <td><span className="flex items-center gap-1.5 text-xs font-semibold text-[#6b7280]">{pkg.active ? <ToggleRight size={19} className="text-green-600" /> : <ToggleLeft size={19} />} {pkg.active ? "Available" : "Disabled"}</span></td>
                      <td><div className="flex justify-end gap-1"><button title="Edit" className="rounded-lg p-2 text-[#6b7280] hover:bg-orange-50 hover:text-[#f97316]"><Pencil size={16} /></button><button title="Delete" className="rounded-lg p-2 text-[#6b7280] hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button><button title="More" className="rounded-lg p-2 text-[#6b7280] hover:bg-gray-100"><MoreHorizontal size={17} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <footer className="py-8 text-center text-xs text-[#9ca3af]">©️2026 POWERED BY FLAMMES TECH</footer>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-2xl">
            <div className="mb-5"><p className="text-xs font-bold uppercase tracking-wider text-[#f97316]">Package Management</p><h2 className="mt-1 text-xl font-extrabold">Create WiFi Package</h2></div>
            <form onSubmit={handleAddPackage} className="space-y-4">
              <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="flames-input" placeholder="Package name" />
              <input required type="number" min="0" step="1" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="flames-input" placeholder="Price (KES)" />
              <input required type="number" min="1" value={formData.durationMinutes} onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })} className="flames-input" placeholder="Duration (minutes)" />
              <div className="flex gap-3 pt-3"><button type="button" onClick={() => setShowModal(false)} className="flames-button-secondary flex-1">Cancel</button><button type="submit" className="flames-button flex-1">Create Package</button></div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
