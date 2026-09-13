"use client";

import { Search, UserPlus, Users } from "lucide-react";

export default function CustomersPage() {
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto max-w-7xl p-5 md:p-8">

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-orange-500">FLAMMES HOTSPOT</p>
            <h1 className="mt-1 text-3xl font-black">
              Customers
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Manage customers using your hotspot network.
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-black">
            <UserPlus size={19} />
            Add Customer
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <Users className="mb-4 text-orange-500" size={22} />
            <p className="text-sm text-gray-500">Total Customers</p>
            <p className="mt-1 text-3xl font-black">0</p>
          </div>

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <div className="mb-4 h-3 w-3 rounded-full bg-green-500" />
            <p className="text-sm text-gray-500">Online</p>
            <p className="mt-1 text-3xl font-black">0</p>
          </div>

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <div className="mb-4 h-3 w-3 rounded-full bg-gray-600" />
            <p className="text-sm text-gray-500">Offline</p>
            <p className="mt-1 text-3xl font-black">0</p>
          </div>

        </div>

        <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">

          <div className="mb-5 flex items-center gap-3 rounded-xl border border-[#252525] bg-[#0b0b0b] px-4 py-3">
            <Search size={19} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search customers..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-600"
            />
          </div>

          <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-[#292929]">
            <div className="text-center">
              <Users
                size={35}
                className="mx-auto mb-3 text-gray-700"
              />
              <p className="font-semibold text-gray-500">
                No customers yet
              </p>
              <p className="mt-1 text-xs text-gray-700">
                Customers will appear here when they connect.
              </p>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
