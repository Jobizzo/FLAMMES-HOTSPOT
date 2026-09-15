"use client";

import { Settings, Bell, Lock, Save } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    businessName: "FLAMMES HOTSPOT",
    email: "admin@flammes-hotspot.com",
    phone: "+254712345678",
    notifications: true,
  });

  const handleSave = () => {
    alert("Settings saved!");
  };

  return (
    <main className="min-h-screen bg-[#070707]">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-[#252525] bg-[#0b0b0b]/95 px-8 py-4 backdrop-blur">
          <div>
            <p className="text-sm-caps text-orange-500">Configuration</p>
            <h1 className="text-2xl font-black text-white">Settings</h1>
          </div>
        </header>

        <div className="flex-1 px-8 py-6 max-w-2xl">
          <div className="space-y-6">
            <div className="flames-card p-6">
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Settings size={20} />
                Business Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={settings.businessName}
                    onChange={(e) =>
                      setSettings({ ...settings, businessName: e.target.value })
                    }
                    className="flames-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) =>
                      setSettings({ ...settings, email: e.target.value })
                    }
                    className="flames-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400 mb-2 block">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) =>
                      setSettings({ ...settings, phone: e.target.value })
                    }
                    className="flames-input"
                  />
                </div>
              </div>
            </div>

            <div className="flames-card p-6">
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Bell size={20} />
                Notifications
              </h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(e) =>
                    setSettings({ ...settings, notifications: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-400">
                  Enable email notifications
                </span>
              </label>
            </div>

            <div className="flames-card p-6">
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Lock size={20} />
                Security
              </h2>
              <button className="flames-button-secondary w-full">
                Change Password
              </button>
            </div>

            <button
              onClick={handleSave}
              className="flames-button w-full flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
