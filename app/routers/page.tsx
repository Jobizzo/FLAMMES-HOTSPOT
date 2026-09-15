"use client";

import { useEffect, useState } from "react";
import { Router, Plus, MapPin, MoreVertical } from "lucide-react";

interface Router {
  id: string;
  name: string;
  brand: string;
  address: string;
  status: "online" | "offline" | "not_connected";
  createdAt: string;
}

export default function RoutersPage() {
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    address: "",
  });

  useEffect(() => {
    fetchRouters();
  }, []);

  const fetchRouters = async () => {
    try {
      const res = await fetch("/api/routers");
      const data = await res.json();
      if (data.success) {
        setRouters(data.data.routers);
      }
    } catch (error) {
      console.error("Failed to fetch routers", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRouter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/routers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setRouters([...routers, data.data]);
        setFormData({ name: "", brand: "", address: "" });
        setShowModal(false);
      }
    } catch (error) {
      console.error("Failed to add router", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "badge-success";
      case "offline":
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
              <h1 className="text-2xl font-black text-white">Network Routers</h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flames-button flex items-center gap-2"
            >
              <Plus size={18} />
              Add Router
            </button>
          </div>
        </header>

        <div className="flex-1 px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Loading routers...</p>
            </div>
          ) : routers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#292929] py-12">
              <Router size={32} className="text-gray-700 mb-3" />
              <p className="text-gray-500 font-medium">No routers configured</p>
              <p className="text-gray-600 text-sm mt-1">
                Connect your first router to get started
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="flames-button mt-4"
              >
                Add Router
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {routers.map((router) => (
                <div key={router.id} className="flames-card p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                      <Router size={20} />
                    </div>
                    <span className={`badge ${getStatusColor(router.status)}`}>
                      {router.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-1">
                    {router.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">{router.brand}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                    <MapPin size={16} />
                    {router.address}
                  </div>
                  <div className="mt-auto flex gap-2">
                    <button className="flames-button-secondary flex-1">
                      Edit
                    </button>
                    <button className="flames-button-ghost flex-1">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
          <div className="flames-card w-full max-w-md p-6">
            <h2 className="text-xl font-black text-white mb-4">Add Router</h2>
            <form onSubmit={handleAddRouter} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">
                  Router Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="flames-input"
                  placeholder="Main Office"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">
                  Router Brand/Model
                </label>
                <input
                  type="text"
                  required
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  className="flames-input"
                  placeholder="TP-Link Archer C7"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">
                  Location/Address
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="flames-input"
                  placeholder="Westlands, Nairobi"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flames-button-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="flames-button flex-1">
                  Add Router
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
