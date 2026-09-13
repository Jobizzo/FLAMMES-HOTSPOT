"use client";

import {
  Router,
  Plus,
  Wifi,
  WifiOff,
  Users,
  Activity,
  Settings,
  MoreVertical,
} from "lucide-react";

const routers = [
  {
    name: "Main Router",
    brand: "MikroTik",
    address: "Not configured",
    users: 0,
    status: "Not Connected",
    bandwidth: "—",
  },
];

export default function RoutersPage() {
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto max-w-7xl p-5 md:p-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm text-orange-500">
              FLAMMES HOTSPOT
            </p>

            <h1 className="mt-1 text-3xl font-black">
              Routers
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Connect and manage the routers powering your hotspot
              network.
            </p>
          </div>

          <button
            disabled
            className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-black opacity-60"
          >
            <Plus size={18} />
            Add Router
          </button>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <Router
              size={22}
              className="mb-4 text-orange-500"
            />

            <p className="text-sm text-gray-500">
              Total Routers
            </p>

            <p className="mt-1 text-3xl font-black">
              0
            </p>
          </div>

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <Wifi
              size={22}
              className="mb-4 text-green-500"
            />

            <p className="text-sm text-gray-500">
              Online
            </p>

            <p className="mt-1 text-3xl font-black">
              0
            </p>
          </div>

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <WifiOff
              size={22}
              className="mb-4 text-red-500"
            />

            <p className="text-sm text-gray-500">
              Offline
            </p>

            <p className="mt-1 text-3xl font-black">
              0
            </p>
          </div>

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <Users
              size={22}
              className="mb-4 text-orange-500"
            />

            <p className="text-sm text-gray-500">
              Connected Users
            </p>

            <p className="mt-1 text-3xl font-black">
              0
            </p>
          </div>

        </div>

        {/* Router Cards */}
        <div className="mb-8">

          <div className="mb-5">
            <h2 className="text-lg font-bold">
              Network Routers
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              Routers registered with your FLAMMES HOTSPOT system.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">

            {routers.map((router) => (

              <div
                key={router.name}
                className="rounded-2xl border border-[#252525] bg-[#111] p-6"
              >

                {/* Router Header */}
                <div className="flex items-start justify-between">

                  <div className="flex items-center gap-4">

                    <div className="rounded-xl bg-orange-500/10 p-3">
                      <Router
                        size={24}
                        className="text-orange-500"
                      />
                    </div>

                    <div>
                      <h3 className="font-bold">
                        {router.name}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {router.brand}
                      </p>
                    </div>

                  </div>

                  <button
                    disabled
                    className="rounded-lg p-2 text-gray-600"
                  >
                    <MoreVertical size={19} />
                  </button>

                </div>

                {/* Status */}
                <div className="mt-6 flex items-center justify-between rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">

                  <div className="flex items-center gap-3">

                    <span className="h-2.5 w-2.5 rounded-full bg-gray-600" />

                    <div>
                      <p className="text-sm font-semibold">
                        {router.status}
                      </p>

                      <p className="text-xs text-gray-600">
                        Connection status
                      </p>
                    </div>

                  </div>

                  <Activity
                    size={18}
                    className="text-gray-600"
                  />

                </div>

                {/* Details */}
                <div className="mt-5 grid grid-cols-2 gap-3">

                  <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">

                    <p className="text-xs text-gray-600">
                      ADDRESS
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      {router.address}
                    </p>

                  </div>

                  <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">

                    <p className="text-xs text-gray-600">
                      USERS
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      {router.users}
                    </p>

                  </div>

                  <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">

                    <p className="text-xs text-gray-600">
                      BANDWIDTH
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      {router.bandwidth}
                    </p>

                  </div>

                  <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">

                    <p className="text-xs text-gray-600">
                      TYPE
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      MikroTik
                    </p>

                  </div>

                </div>

                {/* Actions */}
                <div className="mt-5 flex gap-3">

                  <button
                    disabled
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#292929] bg-[#0b0b0b] px-4 py-3 text-sm font-semibold text-gray-600"
                  >
                    <Settings size={16} />
                    Configure
                  </button>

                  <button
                    disabled
                    className="rounded-xl border border-[#292929] px-4 py-3 text-sm text-gray-600"
                  >
                    Test
                  </button>

                </div>

              </div>

            ))}

          </div>
        </div>

        {/* Supported Integrations */}
        <div className="rounded-2xl border border-[#252525] bg-[#111] p-6">

          <h2 className="text-lg font-bold">
            Router Integration
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            FLAMMES HOTSPOT is being designed with an adapter-based
            network architecture so different router platforms can
            be supported without rebuilding the entire system.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="text-xs text-orange-500">
                PRIMARY
              </p>

              <p className="mt-2 font-bold">
                MikroTik
              </p>

              <p className="mt-1 text-xs text-gray-500">
                HotSpot API / RADIUS
              </p>
            </div>

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">
              <p className="text-xs text-gray-600">
                PLANNED
              </p>

              <p className="mt-2 font-bold">
                TP-Link
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Adapter integration
              </p>
            </div>

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">
              <p className="text-xs text-gray-600">
                PLANNED
              </p>

              <p className="mt-2 font-bold">
                Ubiquiti
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Adapter integration
              </p>
            </div>

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">
              <p className="text-xs text-gray-600">
                EXTENSIBLE
              </p>

              <p className="mt-2 font-bold">
                Other Routers
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Custom adapters
              </p>
            </div>

          </div>

        </div>

        {/* Important Note */}
        <div className="mt-8 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">

          <h2 className="font-bold text-orange-500">
            Network Integration
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            The dashboard is ready for router integration, but
            routers will not be controlled until the backend network
            adapter is connected. The next stage will add secure
            router communication, authentication, customer session
            control and automatic internet activation.
          </p>

        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-[#252525] pt-6 text-center text-xs text-gray-600">
          © 2026 FLAMMES TECH. All rights reserved. Powered by FLAMMES TECH
        </footer>

      </div>
    </main>
  );
                }
