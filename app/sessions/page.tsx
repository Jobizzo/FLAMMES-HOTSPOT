"use client";

import {
  Activity,
  Clock,
  Wifi,
  User,
  Router,
  LogOut,
} from "lucide-react";

const sessions = [
  {
    customer: "No active customer",
    device: "—",
    package: "—",
    duration: "—",
    router: "—",
    status: "Waiting",
  },
];

export default function SessionsPage() {
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto max-w-7xl p-5 md:p-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-orange-500">
            FLAMMES HOTSPOT
          </p>

          <h1 className="mt-1 text-3xl font-black">
            Active Sessions
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Monitor customers currently using your hotspot network.
          </p>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <Activity
              size={22}
              className="mb-4 text-orange-500"
            />

            <p className="text-sm text-gray-500">
              Active Sessions
            </p>

            <p className="mt-1 text-3xl font-black">
              0
            </p>
          </div>

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <Clock
              size={22}
              className="mb-4 text-orange-500"
            />

            <p className="text-sm text-gray-500">
              Total Session Time
            </p>

            <p className="mt-1 text-3xl font-black">
              0h
            </p>
          </div>

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <Wifi
              size={22}
              className="mb-4 text-orange-500"
            />

            <p className="text-sm text-gray-500">
              Connected Devices
            </p>

            <p className="mt-1 text-3xl font-black">
              0
            </p>
          </div>

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <Router
              size={22}
              className="mb-4 text-orange-500"
            />

            <p className="text-sm text-gray-500">
              Routers Online
            </p>

            <p className="mt-1 text-3xl font-black">
              0
            </p>
          </div>

        </div>

        {/* Current Sessions */}
        <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">

          <div className="mb-5 flex items-center justify-between">

            <div>
              <h2 className="text-lg font-bold">
                Current Sessions
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Customers currently connected to the hotspot.
              </p>
            </div>

            <Activity
              size={21}
              className="text-orange-500"
            />

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[800px] text-left">

              <thead>
                <tr className="border-b border-[#252525] text-xs text-gray-500">

                  <th className="px-4 py-4">
                    CUSTOMER
                  </th>

                  <th className="px-4 py-4">
                    DEVICE
                  </th>

                  <th className="px-4 py-4">
                    PACKAGE
                  </th>

                  <th className="px-4 py-4">
                    DURATION
                  </th>

                  <th className="px-4 py-4">
                    ROUTER
                  </th>

                  <th className="px-4 py-4">
                    STATUS
                  </th>

                  <th className="px-4 py-4">
                    ACTION
                  </th>

                </tr>
              </thead>

              <tbody>

                {sessions.map((session) => (
                  <tr
                    key={session.customer}
                    className="border-b border-[#1d1d1d]"
                  >

                    <td className="px-4 py-5">

                      <div className="flex items-center gap-3">

                        <div className="rounded-lg bg-orange-500/10 p-2">
                          <User
                            size={17}
                            className="text-orange-500"
                          />
                        </div>

                        <span className="text-sm font-semibold">
                          {session.customer}
                        </span>

                      </div>

                    </td>

                    <td className="px-4 py-5 text-sm text-gray-500">
                      {session.device}
                    </td>

                    <td className="px-4 py-5 text-sm text-gray-500">
                      {session.package}
                    </td>

                    <td className="px-4 py-5 text-sm text-gray-500">
                      {session.duration}
                    </td>

                    <td className="px-4 py-5 text-sm text-gray-500">
                      {session.router}
                    </td>

                    <td className="px-4 py-5">

                      <span className="rounded-full bg-gray-500/10 px-3 py-1 text-xs text-gray-500">
                        {session.status}
                      </span>

                    </td>

                    <td className="px-4 py-5">

                      <button
                        disabled
                        className="flex items-center gap-2 rounded-lg border border-[#292929] px-3 py-2 text-xs text-gray-600"
                      >

                        <LogOut size={15} />

                        Disconnect

                      </button>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* Session Management */}
        <div className="mt-8 rounded-2xl border border-[#252525] bg-[#111] p-6">

          <h2 className="text-lg font-bold">
            Session Management
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Sessions will automatically appear here when customers
            connect through the captive portal.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">

              <p className="text-xs text-gray-500">
                AUTO SESSION TRACKING
              </p>

              <p className="mt-2 font-semibold text-green-500">
                Enabled
              </p>

            </div>

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">

              <p className="text-xs text-gray-500">
                AUTO EXPIRATION
              </p>

              <p className="mt-2 font-semibold text-green-500">
                Enabled
              </p>

            </div>

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">

              <p className="text-xs text-gray-500">
                ROUTER CONTROL
              </p>

              <p className="mt-2 font-semibold text-orange-500">
                Integration Required
              </p>

            </div>

          </div>

        </div>

        {/* Footer */}
        <footer className="mt-10 border-t border-[#252525] pt-6 text-center text-xs text-gray-600">
          © 2026 FLAMMES TECH. All rights reserved. Powered by FLAMMES TECH
        </footer>

      </div>
    </main>
  );
}
