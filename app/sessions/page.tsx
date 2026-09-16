"use client";

import { useEffect, useState } from "react";
import { Wifi, MoreVertical, RefreshCw } from "lucide-react";

interface Session { id: string; customerId: string; packageId: string; routerId: string; startedAt: string; expiresAt: string; status: "active" | "expired" | "disconnected"; }

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchSessions(); }, []);
  const fetchSessions = async () => { try { const res = await fetch("/api/sessions"); const data = await res.json(); if (data.success) setSessions(data.data.sessions); } catch (error) { console.error("Failed to fetch sessions", error); } finally { setLoading(false); } };
  const getStatusColor = (status: string) => status === "active" ? "badge-success" : status === "expired" ? "badge-danger" : "badge-warning";

  return <main className="admin-light min-h-screen"><div className="flex min-h-screen flex-col">
    <header className="sticky top-0 z-20 border-b border-[#252525] bg-[#0b0b0b]/95 px-5 py-4 sm:px-8"><div className="flex items-center justify-between"><div><p className="text-sm-caps text-orange-500">Network Operations</p><h1 className="text-2xl font-black text-white">Active Sessions</h1><p className="mt-1 text-sm text-gray-500">Monitor connected customers and session expiry.</p></div><button onClick={fetchSessions} className="flames-button-secondary flex items-center gap-2"><RefreshCw size={16}/>Refresh</button></div></header>
    <div className="flex-1 px-5 py-6 sm:px-8">{loading ? <div className="flex justify-center py-12"><p className="text-gray-500">Loading sessions...</p></div> : sessions.length === 0 ? <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#292929] bg-white py-16"><Wifi size={32} className="mb-3 text-sky-500"/><p className="font-medium text-gray-500">No active sessions</p><p className="mt-1 text-sm text-gray-600">Sessions will appear here when customers connect.</p></div> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Package</th><th className="px-5 py-3">Router</th><th className="px-5 py-3">Started</th><th className="px-5 py-3">Expires</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{sessions.map((session)=><tr key={session.id} className="hover:bg-slate-50"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><Wifi size={17}/></div><span className="font-semibold text-slate-900">Customer {session.customerId}</span></div></td><td className="px-5 py-4 text-slate-600">{session.packageId}</td><td className="px-5 py-4 text-slate-600">{session.routerId}</td><td className="px-5 py-4 text-slate-600">{new Date(session.startedAt).toLocaleTimeString()}</td><td className="px-5 py-4 text-slate-600">{new Date(session.expiresAt).toLocaleTimeString()}</td><td className="px-5 py-4"><span className={`badge ${getStatusColor(session.status)}`}>{session.status}</span></td><td className="px-5 py-4 text-right"><button className="rounded-lg p-2 hover:bg-slate-100" aria-label="Session actions"><MoreVertical size={18} className="text-slate-500"/></button></td></tr>)}</tbody></table></div>}</div>
  </div></main>;
}
