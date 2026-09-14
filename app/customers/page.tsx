"use client";

import { useEffect, useMemo, useState } from "react";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  status: "active" | "inactive" | "expired";
  created_at: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  async function loadCustomers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/customers");

      if (!response.ok) {
        throw new Error("Failed to load customers.");
      }

      const data = await response.json();

      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      setError("Name and phone number are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add customer."
        );
      }

      setCustomers((current) => [data, ...current]);

      setName("");
      setPhone("");
      setEmail("");
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query) ||
        (customer.email || "")
          .toLowerCase()
          .includes(query)
    );
  }, [customers, search]);

  const activeCount = customers.filter(
    (customer) => customer.status === "active"
  ).length;

  const expiredCount = customers.filter(
    (customer) => customer.status === "expired"
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 text-sm font-semibold uppercase tracking-widest text-orange-400">
              FLAMMES HOTSPOT
            </div>

            <h1 className="text-3xl font-bold sm:text-4xl">
              Customers
            </h1>

            <p className="mt-2 text-slate-400">
              Manage customers connected to your hotspot.
            </p>
          </div>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setError("");
            }}
            className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600"
          >
            {showForm ? "Close" : "+ Add Customer"}
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Total Customers
            </p>

            <p className="mt-2 text-3xl font-bold">
              {customers.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Active
            </p>

            <p className="mt-2 text-3xl font-bold text-green-400">
              {activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              Expired
            </p>

            <p className="mt-2 text-3xl font-bold text-red-400">
              {expiredCount}
            </p>
          </div>

        </div>

        {/* Add Customer Form */}
        {showForm && (
          <form
            onSubmit={addCustomer}
            className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6"
          >
            <h2 className="mb-5 text-xl font-bold">
              Add New Customer
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Full Name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Customer name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Phone Number
                </label>

                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-orange-500"
                />
              </div>

            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-5 rounded-xl bg-orange-500 px-6 py-3 font-semibold hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Customer"}
            </button>
          </form>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone or email..."
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-orange-500"
          />

          <button
            onClick={loadCustomers}
            className="rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 font-semibold hover:bg-slate-800"
          >
            Refresh
          </button>

        </div>

        {/* Customer List */}
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

          <div className="border-b border-slate-800 px-5 py-4">
            <h2 className="font-bold">
              Customer List
            </h2>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-400">
              Loading customers...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-10 text-center">

              <div className="mb-3 text-4xl">
                👥
              </div>

              <h3 className="text-lg font-semibold">
                {search
                  ? "No customers found"
                  : "No customers yet"}
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                {search
                  ? "Try a different search."
                  : "Add your first customer to get started."}
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px]">

                <thead className="bg-slate-950/50">
                  <tr className="text-left text-sm text-slate-400">

                    <th className="px-5 py-4">
                      Customer
                    </th>

                    <th className="px-5 py-4">
                      Phone
                    </th>

                    <th className="px-5 py-4">
                      Email
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Joined
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-t border-slate-800"
                    >

                      <td className="px-5 py-4 font-semibold">
                        {customer.name}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {customer.phone}
                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        {customer.email || "—"}
                      </td>

                      <td className="px-5 py-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            customer.status === "active"
                              ? "bg-green-500/10 text-green-400"
                              : customer.status === "expired"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {customer.status}
                        </span>

                      </td>

                      <td className="px-5 py-4 text-slate-400">
                        {new Date(
                          customer.created_at
                        ).toLocaleDateString()}
                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
          © 2026 FLAMMES TECH. All rights reserved. Powered by FLAMMES TECH
        </footer>

      </div>
    </main>
  );
}
