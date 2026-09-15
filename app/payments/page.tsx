"use client";

import { useEffect, useState } from "react";
import { CreditCard, MoreVertical } from "lucide-react";

interface Payment {
  id: string;
  customerId: string;
  packageId: string;
  amount: number;
  method: "mpesa" | "card" | "bank" | "other";
  status: "pending" | "successful" | "failed";
  transactionId?: string;
  createdAt: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/payments");
      const data = await res.json();
      if (data.success) {
        setPayments(data.data.payments);
        setTotalRevenue(data.data.revenue);
      }
    } catch (error) {
      console.error("Failed to fetch payments", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "successful":
        return "badge-success";
      case "pending":
        return "badge-warning";
      case "failed":
        return "badge-danger";
      default:
        return "badge-primary";
    }
  };

  return (
    <main className="min-h-screen bg-[#070707]">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-[#252525] bg-[#0b0b0b]/95 px-8 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm-caps text-orange-500">Management</p>
              <h1 className="text-2xl font-black text-white">Payments</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Total Revenue</p>
              <p className="text-2xl font-black text-green-400">
                KES {totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#292929] py-12">
              <CreditCard size={32} className="text-gray-700 mb-3" />
              <p className="text-gray-500 font-medium">No payments yet</p>
              <p className="text-gray-600 text-sm mt-1">
                Payment history will appear here
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flames-card p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                      <CreditCard size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">
                        KES {payment.amount.toLocaleString()}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {payment.method.toUpperCase()} • {payment.transactionId && `${payment.transactionId} •`} {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`badge ${getStatusBadgeColor(payment.status)}`}
                    >
                      {payment.status}
                    </span>
                    <button className="p-2 hover:bg-[#181818] rounded-lg">
                      <MoreVertical size={18} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
