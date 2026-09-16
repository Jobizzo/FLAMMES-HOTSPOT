"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Search, MoreVertical, Phone, Mail } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: "active" | "inactive" | "expired";
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.success) setCustomers(data.data.customers);
    } catch (error) { console.error("Failed to fetch customers", error); }
    finally { setLoading(false); }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.success) {
        setCustomers([...customers, data.data]);
        setFormData({ name: "", phone: "", email: "" });
        setShowModal(false);
      }
    } catch (error) { console.error("Failed to add customer", error); }
  };

  const filteredCustomers = customers.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm));

  return (
    <main className="admin-light min-h-screen">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-[#252525] bg-[#0b0b0b]/95 px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div><p className="text-sm-caps text-orange-500">Management</p><h1 className="text-2xl font-black text-white">Customers</h1></div>
            <button onClick={() => setShowModal(true)} className="flames-button flex items-center gap-2"><Plus size={18} />Add Customer</button>
          </div>
        </header>

        <div className="border-b border-[#252525] bg-[#0b0b0b] px-5 py-4 sm:px-8">
          <div className="relative max-w-xl">
            <Search size={18} className="absolute left-3 top-3 text-gray-600" />
            <input type="text" placeholder="Search customers by name or phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flames-input pl-10" />
          </div>
        </div>

        <div className="flex-1 px-5 py-6 sm:px-8">
          {loading ? <div className="flex items-center justify-center py-12"><p className="text-gray-500">Loading customers...</p></div> : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#292929] bg-white py-16">
              <Users size={32} className="mb-3 text-gray-700" /><p className="font-medium text-gray-500">No customers yet</p><p className="mt-1 text-sm text-gray-600">Add your first customer to get started</p>
              <button onClick={() => setShowModal(true)} className="flames-button mt-4">Add Customer</button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Customer</th><th className="px-5 py-3 font-semibold">Phone</th><th className="px-5 py-3 font-semibold">Email</th><th className="px-5 py-3 font-semibold">Status</th><th className="px-5 py-3 text-right font-semibold">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{filteredCustomers.map((customer) => <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><Users size={17} /></div><span className="font-semibold text-slate-900">{customer.name}</span></div></td>
                  <td className="px-5 py-4 text-slate-600"><span className="flex items-center gap-2"><Phone size={14} />{customer.phone}</span></td>
                  <td className="px-5 py-4 text-slate-600">{customer.email ? <span className="flex items-center gap-2"><Mail size={14} />{customer.email}</span> : "—"}</td>
                  <td className="px-5 py-4"><span className={`badge ${customer.status === "active" ? "badge-success" : customer.status === "expired" ? "badge-danger" : "badge-warning"}`}>{customer.status}</span></td>
                  <td className="px-5 py-4 text-right"><button className="rounded-lg p-2 hover:bg-slate-100" aria-label={`Actions for ${customer.name}`}><MoreVertical size={18} className="text-slate-500" /></button></td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur">
        <div className="flames-card w-full max-w-md p-6">
          <h2 className="mb-4 text-xl font-black text-slate-900">Add Customer</h2>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            <div><label className="mb-2 block text-sm font-medium text-slate-600">Customer Name</label><input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="flames-input" placeholder="John Doe" /></div>
            <div><label className="mb-2 block text-sm font-medium text-slate-600">Phone Number</label><input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="flames-input" placeholder="+254712345678" /></div>
            <div><label className="mb-2 block text-sm font-medium text-slate-600">Email (Optional)</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="flames-input" placeholder="john@example.com" /></div>
            <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowModal(false)} className="flames-button-secondary flex-1">Cancel</button><button type="submit" className="flames-button flex-1">Add Customer</button></div>
          </form>
        </div>
      </div>}
    </main>
  );
}
