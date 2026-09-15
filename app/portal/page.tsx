"use client";

import { useEffect, useState } from "react";
import { Wifi, Phone, ArrowRight, Loader, CheckCircle } from "lucide-react";

interface Package {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  active: boolean;
}

type PortalStep = "select" | "phone" | "processing" | "success" | "error";

export default function CaptivePortal() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<PortalStep>("select");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [checkoutRequestID, setCheckoutRequestID] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [error, setError] = useState("");
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/packages");
      const data = await res.json();
      if (data.success) {
        setPackages(data.data.packages.filter((p: Package) => p.active));
      }
    } catch (error) {
      console.error("Failed to fetch packages", error);
      setError("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setStep("phone");
    setError("");
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!phoneNumber || !selectedPackage) {
      setError("Please enter a valid phone number");
      return;
    }

    setStep("processing");

    try {
      // Send STK push
      const res = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          amount: selectedPackage.price,
          packageId: selectedPackage.id,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to send payment prompt");
        setStep("error");
        return;
      }

      setSessionId(data.data.sessionId);
      setCheckoutRequestID(data.data.checkoutRequestID);

      // Start polling for payment status
      pollPaymentStatus(
        data.data.checkoutRequestID,
        phoneNumber,
        selectedPackage
      );
    } catch (err: any) {
      setError(err.message || "Failed to process payment");
      setStep("error");
    }
  };

  const pollPaymentStatus = async (
    checkoutRequestID: string,
    phone: string,
    pkg: Package
  ) => {
    let attempts = 0;
    const maxAttempts = 30; // Poll for 30 seconds

    const poll = async () => {
      try {
        const res = await fetch("/api/mpesa/query-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutRequestID }),
        });

        const data = await res.json();

        if (data.success && data.data.status === "successful") {
          // Payment successful - generate voucher
          const voucherRes = await fetch("/api/mpesa/voucher", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phoneNumber: phone,
              packageId: pkg.id,
              durationMinutes: pkg.durationMinutes,
            }),
          });

          const voucherData = await voucherRes.json();
          if (voucherData.success) {
            setVoucherCode(voucherData.data.voucherCode);
            setStep("success");
          }
        } else if (attempts < maxAttempts) {
          attempts++;
          setPollCount(attempts);
          // Poll again after 1 second
          setTimeout(poll, 1000);
        } else {
          setError("Payment timeout. Please try again.");
          setStep("error");
        }
      } catch (err) {
        console.error("Poll error:", err);
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(poll, 1000);
        } else {
          setError("Failed to verify payment");
          setStep("error");
        }
      }
    };

    poll();
  };

  return (
    <main className="min-h-screen bg-[#070707] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-[#252525] bg-[#0b0b0b] px-4 py-6 md:px-8">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-xl font-bold">
            🔥
          </div>
          <div>
            <h1 className="text-2xl font-black">FLAMMES HOTSPOT</h1>
            <p className="text-xs text-orange-500 font-bold tracking-wider">
              Free WiFi Network
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-8 md:px-8 flex items-center justify-center">
        <div className="max-w-md w-full">
          {/* Step 1: Select Package */}
          {step === "select" && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black mb-2">Choose Your Plan</h2>
                <p className="text-gray-400">
                  Select a WiFi package to get instant access
                </p>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <Loader size={32} className="animate-spin mx-auto text-orange-500" />
                  <p className="text-gray-500 mt-4">Loading packages...</p>
                </div>
              ) : packages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No packages available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => handleSelectPackage(pkg)}
                      className="flames-card p-4 w-full flex items-center justify-between hover:border-orange-500/50 transition group"
                    >
                      <div className="text-left">
                        <p className="font-bold">{pkg.name}</p>
                        <p className="text-sm text-gray-500">
                          {pkg.durationMinutes < 60
                            ? `${pkg.durationMinutes} minutes`
                            : `${Math.floor(pkg.durationMinutes / 60)} hours`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-500 font-black">
                          KES {pkg.price}
                        </p>
                        <ArrowRight
                          size={20}
                          className="text-orange-500 group-hover:translate-x-1 transition mt-1"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Enter Phone Number */}
          {step === "phone" && selectedPackage && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black mb-2">Enter Phone Number</h2>
                <p className="text-gray-400">
                  We'll send an M-Pesa prompt to your phone
                </p>
              </div>

              <div className="flames-card p-6 space-y-4">
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400 mb-2 block">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone
                        size={18}
                        className="absolute left-3 top-3 text-gray-600"
                      />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="flames-input pl-10"
                        placeholder="0712345678 or +254712345678"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Kenyan format: 0712345678 or +254712345678
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Order Summary */}
                  <div className="rounded-lg bg-[#111] p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Plan:</span>
                      <span className="font-bold">{selectedPackage.name}</span>
                    </div>
                    <div className="h-px bg-[#252525]" />
                    <div className="flex items-center justify-between text-lg">
                      <span className="font-bold">Total:</span>
                      <span className="text-orange-500 font-black">
                        KES {selectedPackage.price}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setStep("select");
                        setSelectedPackage(null);
                        setError("");
                      }}
                      className="flames-button-secondary flex-1"
                    >
                      Back
                    </button>
                    <button type="submit" className="flames-button flex-1">
                      Send M-Pesa Prompt
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Step 3: Processing Payment */}
          {step === "processing" && (
            <div className="animate-slide-up text-center">
              <div className="mb-6">
                <Loader size={40} className="animate-spin mx-auto text-orange-500 mb-4" />
                <h2 className="text-2xl font-black mb-2">Completing Payment</h2>
                <p className="text-gray-400">
                  Check your phone for the M-Pesa prompt
                </p>
                <p className="text-gray-500 text-sm mt-3">
                  Enter your M-Pesa PIN on your phone to confirm payment
                </p>
              </div>

              <div className="flames-card p-6 space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-400">Waiting for payment confirmation...</p>
                  <p className="text-xs text-gray-600">
                    {pollCount > 0 && `Checking... (${pollCount}s)`}
                  </p>
                </div>

                {/* Order Summary */}
                <div className="rounded-lg bg-[#111] p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Amount:</span>
                    <span className="font-bold">
                      KES {selectedPackage?.price}
                    </span>
                  </div>
                  <div className="h-px bg-[#252525]" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Phone:</span>
                    <span className="font-bold">{phoneNumber}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === "success" && selectedPackage && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500 mx-auto mb-4">
                  <CheckCircle size={32} />
                </div>
                <h2 className="text-3xl font-black mb-2">Payment Successful!</h2>
                <p className="text-gray-400">
                  Your WiFi access is now active
                </p>
              </div>

              <div className="flames-card p-6 space-y-6">
                {/* Voucher Code */}
                <div className="rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30 p-6 text-center">
                  <p className="text-xs text-orange-400 font-bold tracking-wider mb-2">
                    YOUR VOUCHER CODE
                  </p>
                  <p className="text-3xl font-black font-mono break-all mb-2">
                    {voucherCode}
                  </p>
                  <p className="text-xs text-gray-500">
                    Valid for {selectedPackage.durationMinutes} minutes
                  </p>
                </div>

                {/* Connection Instructions */}
                <div className="space-y-3">
                  <p className="text-sm font-bold">How to connect:</p>
                  <ol className="space-y-2 text-sm text-gray-400">
                    <li className="flex gap-3">
                      <span className="font-bold text-orange-500 flex-shrink-0">1.</span>
                      <span>Open any website in your browser</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-orange-500 flex-shrink-0">2.</span>
                      <span>You'll be redirected to the login page</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-orange-500 flex-shrink-0">3.</span>
                      <span>Enter your voucher code above</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="font-bold text-orange-500 flex-shrink-0">4.</span>
                      <span>Enjoy unlimited browsing!</span>
                    </li>
                  </ol>
                </div>

                {/* Button */}
                <button
                  onClick={() => {
                    setStep("select");
                    setSelectedPackage(null);
                    setPhoneNumber("");
                    setVoucherCode("");
                    setError("");
                  }}
                  className="flames-button w-full"
                >
                  Back to Plans
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {step === "error" && (
            <div className="animate-slide-up text-center">
              <div className="mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-500 mx-auto mb-4">
                  <span className="text-3xl">✕</span>
                </div>
                <h2 className="text-2xl font-black mb-2">Payment Failed</h2>
                <p className="text-gray-400">{error}</p>
              </div>

              <div className="flames-card p-6">
                <button
                  onClick={() => {
                    setStep("select");
                    setSelectedPackage(null);
                    setPhoneNumber("");
                    setError("");
                  }}
                  className="flames-button w-full"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#252525] bg-[#0b0b0b] px-4 py-4 text-center text-xs text-gray-600">
        © 2026 FLAMMES TECH. Secure WiFi Network.
      </footer>
    </main>
  );
}
