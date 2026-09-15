"use client";

import { useEffect, useState } from "react";
import { Wifi, MoreVertical } from "lucide-react";

interface Session {
  id: string;
  customerId: string;
  packageId: string;
  routerId: string;
  startedAt: string;
  expiresAt: string;
  status: "active" | "expired" | "disconnected";
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      if (data.success) {
        setSessions(data.data.sessions);
      }
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "badge-success";
      case "expired":
        return "badge-danger";
      default:
        return "badge-warning";
    }
  };

  return (
    <main className="min-h-screen bg-[#070707]">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-[#252525] bg-[#0b0b0b]/95 px-8 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm-caps text-orange-500">Management</p>
              <h1 className="text-2xl font-black text-white">Active Sessions</h1>
            </div>
          </div>
        </header>

        <div className="flex-1 px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#292929] py-12">
              <Wifi size={32} className="text-gray-700 mb-3" />
              <p className="text-gray-500 font-medium">No active sessions</p>
              <p className="text-gray-600 text-sm mt-1">
                Sessions will appear here when customers connect
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flames-card p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                      <Wifi size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">
                        Customer {session.customerId}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(session.startedAt).toLocaleTimeString()} — {new Date(session.expiresAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${getStatusColor(session.status)}`}>
                      {session.status}
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
