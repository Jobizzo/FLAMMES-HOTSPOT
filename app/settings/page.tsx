"use client";

import { Settings, Bell, Lock, Save } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({ businessName: "FLAMMES HOTSPOT", email: "admin@flammes-hotspot.com", phone: "+254712345678", notifications: true });
  const handleSave = () => { alert("Settings saved!"); };

  return <main className="admin-light min-h-screen"><div className="flex min-h-screen flex-col">
    <header className="sticky top-0 z-20 border-b border-[#252525] bg-[#0b0b0b]/95 px-5 py-4 sm:px-8"><div><p className="text-sm-caps text-orange-500">Configuration</p><h1 className="text-2xl font-black text-white">Settings</h1><p className="mt-1 text-sm text-gray-500">Configure business, notification and security preferences.</p></div></header>
    <div className="flex-1 px-5 py-6 sm:px-8"><div className="grid max-w-5xl gap-5 lg:grid-cols-2">
      <div className="flames-card"><h2 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-900"><Settings size={20} className="text-orange-600"/>Business Settings</h2><div className="space-y-4"><div><label className="mb-2 block text-sm font-medium text-slate-600">Business Name</label><input type="text" value={settings.businessName} onChange={(e)=>setSettings({...settings,businessName:e.target.value})} className="flames-input"/></div><div><label className="mb-2 block text-sm font-medium text-slate-600">Email</label><input type="email" value={settings.email} onChange={(e)=>setSettings({...settings,email:e.target.value})} className="flames-input"/></div><div><label className="mb-2 block text-sm font-medium text-slate-600">Phone</label><input type="tel" value={settings.phone} onChange={(e)=>setSettings({...settings,phone:e.target.value})} className="flames-input"/></div></div></div>
      <div className="flames-card"><h2 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-900"><Bell size={20} className="text-orange-600"/>Notifications</h2><label className="flex cursor-pointer items-center gap-3"><input type="checkbox" checked={settings.notifications} onChange={(e)=>setSettings({...settings,notifications:e.target.checked})} className="h-4 w-4 accent-orange-500"/><span className="text-sm text-slate-600">Enable email notifications</span></label><div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Notification preferences will control operational alerts and payment updates.</div></div>
      <div className="flames-card"><h2 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-900"><Lock size={20} className="text-orange-600"/>Security</h2><p className="mb-4 text-sm text-slate-500">Protect administrator access to the hotspot management system.</p><button className="flames-button-secondary w-full">Change Password</button></div>
      <div className="flames-card flex flex-col justify-between"><div><p className="text-sm-caps text-orange-600">Apply Configuration</p><h2 className="mt-2 text-lg font-black text-slate-900">Save your changes</h2><p className="mt-2 text-sm text-slate-500">Review the settings above before applying them.</p></div><button onClick={handleSave} className="flames-button mt-6 flex w-full items-center justify-center gap-2"><Save size={18}/>Save Changes</button></div>
    </div></div>
  </div></main>;
}
