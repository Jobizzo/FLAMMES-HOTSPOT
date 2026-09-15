"use client";

import { BarChart3, Users, DollarSign, TrendingUp } from "lucide-react";

export default function ReportsPage() {
  return (
    <main className="min-h-screen bg-[#070707]">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-[#252525] bg-[#0b0b0b]/95 px-8 py-4 backdrop-blur">
          <div>
            <p className="text-sm-caps text-orange-500">Analytics</p>
            <h1 className="text-2xl font-black text-white">Reports</h1>
          </div>
        </header>

        <div className="flex-1 px-8 py-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[
              {
                label: "Total Customers",
                value: "0",
                icon: Users,
                color: "from-blue-600 to-blue-400",
              },
              {
                label: "Total Revenue",
                value: "KES 0",
                icon: DollarSign,
                color: "from-green-600 to-green-400",
              },
              {
                label: "Active Sessions",
                value: "0",
                icon: TrendingUp,
                color: "from-purple-600 to-purple-400",
              },
              {
                label: "Conversion Rate",
                value: "0%",
                icon: BarChart3,
                color: "from-amber-600 to-amber-400",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flames-card p-6">
                  <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-3 w-fit text-white shadow-lg`}>
                    <Icon size={20} />
                  </div>
                  <p className="text-sm text-gray-400 mt-4">{stat.label}</p>
                  <p className="text-2xl font-black text-white mt-1">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flames-card p-8">
            <h2 className="text-xl font-black text-white mb-6">Coming Soon</h2>
            <div className="flex items-center justify-center py-12 rounded-2xl border-2 border-dashed border-[#292929]">
              <div className="text-center">
                <BarChart3 size={32} className="text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Reports are being prepared</p>
                <p className="text-gray-600 text-sm mt-1">
                  Detailed analytics will be available soon
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
