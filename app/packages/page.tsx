"use client";

import { Package, Plus, Clock, Wifi } from "lucide-react";

const packages = [
  {
    name: "1 Hour",
    price: "KES 10",
    duration: "1 hour",
    status: "Active",
  },
  {
    name: "3 Hours",
    price: "KES 20",
    duration: "3 hours",
    status: "Active",
  },
  {
    name: "24 Hours",
    price: "KES 50",
    duration: "24 hours",
    status: "Active",
  },
  {
    name: "7 Days",
    price: "KES 200",
    duration: "7 days",
    status: "Active",
  },
];

export default function PackagesPage() {
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto max-w-7xl p-5 md:p-8">

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-orange-500">FLAMMES HOTSPOT</p>

            <h1 className="mt-1 text-3xl font-black">
              Wi-Fi Packages
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Create and manage internet access packages.
            </p>
          </div>

          <button className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-black">
            <Plus size={19} />
            Create Package
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className="rounded-2xl border border-[#252525] bg-[#111] p-5 transition hover:border-orange-500/40"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="rounded-xl bg-orange-500/10 p-3 text-orange-500">
                  <Package size={21} />
                </div>

                <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-500">
                  {pkg.status}
                </span>
              </div>

              <h2 className="text-xl font-bold">
                {pkg.name}
              </h2>

              <p className="mt-2 text-3xl font-black">
                {pkg.price}
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm text-gray-500">
                <Clock size={16} />
                {pkg.duration}
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Wifi size={16} />
                Internet access
              </div>

              <button className="mt-6 w-full rounded-xl border border-[#292929] py-3 text-sm font-semibold hover:bg-[#181818]">
                Manage Package
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-[#252525] bg-[#111] p-6">
          <h2 className="text-lg font-bold">
            Package Settings
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Later we'll connect these packages directly to your router,
            payment system and captive portal.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">
              <p className="text-xs text-gray-500">
                CONNECTION TYPE
              </p>
              <p className="mt-2 font-semibold">
                Unlimited
              </p>
            </div>

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">
              <p className="text-xs text-gray-500">
                SPEED CONTROL
              </p>
              <p className="mt-2 font-semibold">
                Configurable
              </p>
            </div>

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">
              <p className="text-xs text-gray-500">
                AUTO EXPIRATION
              </p>
              <p className="mt-2 font-semibold">
                Enabled
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-10 border-t border-[#252525] pt-6 text-center text-xs text-gray-600">
          © 2026 FLAMMES TECH. All rights reserved.
        </footer>

      </div>
    </main>
  );
              }
