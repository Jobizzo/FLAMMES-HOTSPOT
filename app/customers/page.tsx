"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Phone,
  Mail,
} from "lucide-react";

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

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data.customers);
      }
    } catch (error) {
      console.error("Failed to fetch customers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setCustomers([...customers, data.data]);
        setFormData({ name: "", phone: "", email: "" });
        setShowModal(false);
      }
    } catch (error) {
      console.error("Failed to add customer", error);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <main className="min-h-screen bg-[#070707]">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-[#252525] bg-[#0b0b0b]/95 px-8 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm-caps text-orange-500">Management</p>
              <h1 className="text-2xl font-black text-white">Customers</h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flames-button flex items-center gap-2"
            >
              <Plus size={18} />
              Add Customer
            </button>
          </div>
        </header>

        <div className="border-b border-[#252525] bg-[#0b0b0b] px-8 py-4">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-3 text-gray-600"
            />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flames-input pl-10"
            />
          </div>
        </div>

        <div className="flex-1 px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#292929] py-12">
              <Users size={32} className="text-gray-700 mb-3" />
              <p className="text-gray-500 font-medium">No customers yet</p>
              <p className="text-gray-600 text-sm mt-1">
                Add your first customer to get started
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="flames-button mt-4"
              >
                Add Customer
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flames-card flex items-center justify-between p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{customer.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone size={14} />
                          {customer.phone}
                        </span>
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={14} />
                            {customer.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge badge-success text-xs">
                      {customer.status}
                    </span>
                    <button className="rounded-lg p-2 hover:bg-[#181818]">
                      <MoreVertical size={18} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
          <div className="flames-card w-full max-w-md p-6">
            <h2 className="text-xl font-black text-white mb-4">Add Customer</h2>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="flames-input"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="flames-input"
                  placeholder="+254712345678"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="flames-input"
                  placeholder="john@example.com"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flames-button-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="flames-button flex-1">
                  Add Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
