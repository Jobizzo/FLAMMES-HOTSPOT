"use client";

import {
  CreditCard,
  CheckCircle2,
  Clock3,
  XCircle,
  Smartphone,
  Search,
  ArrowUpRight,
} from "lucide-react";

const transactions = [
  {
    id: "FLM-PAY-001",
    customer: "No transactions yet",
    package: "—",
    amount: "KES 0",
    method: "—",
    status: "Waiting",
    date: "—",
  },
];

export default function PaymentsPage() {
  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto max-w-7xl p-5 md:p-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-orange-500">FLAMMES HOTSPOT</p>

          <h1 className="mt-1 text-3xl font-black">
            Payments
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage hotspot payments, transactions and M-Pesa integration.
          </p>
        </div>

        {/* Statistics */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <CreditCard
              size={22}
              className="mb-4 text-orange-500"
            />
            <p className="text-sm text-gray-500">
              Total Revenue
            </p>
            <p className="mt-1 text-3xl font-black">
              KES 0
            </p>
          </div>

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <CheckCircle2
              size={22}
              className="mb-4 text-green-500"
            />
            <p className="text-sm text-gray-500">
              Successful
            </p>
            <p className="mt-1 text-3xl font-black">
              0
            </p>
          </div>

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <Clock3
              size={22}
              className="mb-4 text-yellow-500"
            />
            <p className="text-sm text-gray-500">
              Pending
            </p>
            <p className="mt-1 text-3xl font-black">
              0
            </p>
          </div>

          <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">
            <XCircle
              size={22}
              className="mb-4 text-red-500"
            />
            <p className="text-sm text-gray-500">
              Failed
            </p>
            <p className="mt-1 text-3xl font-black">
              0
            </p>
          </div>

        </div>

        {/* M-Pesa Integration */}
        <div className="mb-8 rounded-2xl border border-orange-500/20 bg-[#111] p-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-4">

              <div className="rounded-xl bg-orange-500/10 p-3">
                <Smartphone
                  size={24}
                  className="text-orange-500"
                />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  M-Pesa Payments
                </h2>

                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Connect M-Pesa to automatically receive hotspot
                  payments and activate customer packages after
                  successful payment verification.
                </p>
              </div>

            </div>

            <button
              disabled
              className="rounded-xl border border-[#292929] bg-[#0b0b0b] px-5 py-3 text-sm font-semibold text-gray-500"
            >
              Configure M-Pesa
            </button>

          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">
              <p className="text-xs text-gray-500">
                STK PUSH
              </p>

              <p className="mt-2 font-semibold text-yellow-500">
                Not Connected
              </p>
            </div>

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">
              <p className="text-xs text-gray-500">
                CALLBACK
              </p>

              <p className="mt-2 font-semibold text-yellow-500">
                Not Configured
              </p>
            </div>

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">
              <p className="text-xs text-gray-500">
                AUTO ACTIVATION
              </p>

              <p className="mt-2 font-semibold text-yellow-500">
                Awaiting Integration
              </p>
            </div>

          </div>

        </div>

        {/* Transactions */}
        <div className="rounded-2xl border border-[#252525] bg-[#111] p-5">

          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-lg font-bold">
                Transactions
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                View and monitor all hotspot payment transactions.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#292929] bg-[#0b0b0b] px-3 py-2">
              <Search
                size={16}
                className="text-gray-600"
              />

              <input
                type="text"
                placeholder="Search transactions..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600 md:w-56"
              />
            </div>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] text-left">

              <thead>
                <tr className="border-b border-[#252525] text-xs text-gray-500">

                  <th className="px-4 py-4">
                    TRANSACTION
                  </th>

                  <th className="px-4 py-4">
                    CUSTOMER
                  </th>

                  <th className="px-4 py-4">
                    PACKAGE
                  </th>

                  <th className="px-4 py-4">
                    AMOUNT
                  </th>

                  <th className="px-4 py-4">
                    METHOD
                  </th>

                  <th className="px-4 py-4">
                    STATUS
                  </th>

                  <th className="px-4 py-4">
                    DATE
                  </th>

                  <th className="px-4 py-4">
                    ACTION
                  </th>

                </tr>
              </thead>

              <tbody>

                {transactions.map((transaction) => (

                  <tr
                    key={transaction.id}
                    className="border-b border-[#1d1d1d]"
                  >

                    <td className="px-4 py-5">
                      <span className="text-sm font-semibold">
                        {transaction.id}
                      </span>
                    </td>

                    <td className="px-4 py-5 text-sm text-gray-500">
                      {transaction.customer}
                    </td>

                    <td className="px-4 py-5 text-sm text-gray-500">
                      {transaction.package}
                    </td>

                    <td className="px-4 py-5 text-sm font-semibold">
                      {transaction.amount}
                    </td>

                    <td className="px-4 py-5 text-sm text-gray-500">
                      {transaction.method}
                    </td>

                    <td className="px-4 py-5">

                      <span className="rounded-full bg-gray-500/10 px-3 py-1 text-xs text-gray-500">
                        {transaction.status}
                      </span>

                    </td>

                    <td className="px-4 py-5 text-sm text-gray-500">
                      {transaction.date}
                    </td>

                    <td className="px-4 py-5">

                      <button
                        disabled
                        className="flex items-center gap-2 rounded-lg border border-[#292929] px-3 py-2 text-xs text-gray-600"
                      >
                        <ArrowUpRight size={14} />
                        View
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* Integration Roadmap */}
        <div className="mt-8 rounded-2xl border border-[#252525] bg-[#111] p-6">

          <h2 className="text-lg font-bold">
            Payment Integration Roadmap
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            The payment system will be connected to the hotspot
            network in the next development stage.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">
              <p className="text-xs text-orange-500">
                01
              </p>
              <p className="mt-2 font-semibold">
                Customer selects package
              </p>
            </div>

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">
              <p className="text-xs text-orange-500">
                02
              </p>
              <p className="mt-2 font-semibold">
                M-Pesa STK Push
              </p>
            </div>

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">
              <p className="text-xs text-orange-500">
                03
              </p>
              <p className="mt-2 font-semibold">
                Payment verified
              </p>
            </div>

            <div className="rounded-xl border border-[#252525] bg-[#0b0b0b] p-4">
              <p className="text-xs text-orange-500">
                04
              </p>
              <p className="mt-2 font-semibold">
                Internet activated
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
