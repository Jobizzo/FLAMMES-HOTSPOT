"use client";

import { useEffect, useState } from "react";
import { Package, Plus, Clock } from "lucide-react";

interface HotspotPackage {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  active: boolean;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<HotspotPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    durationMinutes: "",
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/packages");
      const data = await res.json();
      if (data.success) {
        setPackages(data.data.packages);
      }
    } catch (error) {
      console.error("Failed to fetch packages", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          durationMinutes: parseInt(formData.durationMinutes),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPackages([...packages, data.data]);
        setFormData({ name: "", price: "", durationMinutes: "" });
        setShowModal(false);
      }
    } catch (error) {
      console.error("Failed to add package", error);
    }
  };

  return (
    <main className="min-h-screen bg-[#070707]">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-[#252525] bg-[#0b0b0b]/95 px-8 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm-caps text-orange-500">Management</p>
              <h1 className="text-2xl font-black text-white">WiFi Packages</h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flames-button flex items-center gap-2"
            >
              <Plus size={18} />
              Add Package
            </button>
          </div>
        </header>

        <div className="flex-1 px-8 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Loading packages...</p>
            </div>
          ) : packages.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#292929] py-12">
              <Package size={32} className="text-gray-700 mb-3" />
              <p className="text-gray-500 font-medium">No packages yet</p>
              <p className="text-gray-600 text-sm mt-1">
                Create your first WiFi package to get started
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="flames-button mt-4"
              >
                Add Package
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <div key={pkg.id} className="flames-card p-6 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                      <Package size={20} />
                    </div>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-1">
                    {pkg.name}
                  </h3>
                  <p className="text-2xl font-black text-orange-500 mb-4">
                    KES {pkg.price}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock size={16} />
                      {pkg.durationMinutes < 60
                        ? `${pkg.durationMinutes} minutes`
                        : `${Math.floor(pkg.durationMinutes / 60)} hours`}
                    </div>
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
            <h2 className="text-xl font-black text-white mb-4">
              Add WiFi Package
            </h2>
            <form onSubmit={handleAddPackage} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">
                  Package Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="flames-input"
                  placeholder="30-Minute Pass"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">
                  Price (KES)
                </label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  className="flames-input"
                  placeholder="50"
                  min="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400 mb-2 block">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  required
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, durationMinutes: e.target.value })
                  }
                  className="flames-input"
                  placeholder="30"
                  min="1"
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
                  Add Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
