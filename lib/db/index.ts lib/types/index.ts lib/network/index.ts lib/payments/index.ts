export type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: "active" | "inactive" | "expired";
  createdAt: string;
};

export type HotspotPackage = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  active: boolean;
};

export type Router = {
  id: string;
  name: string;
  brand: string;
  address: string;
  status: "online" | "offline" | "not_connected";
  createdAt: string;
};

export type Session = {
  id: string;
  customerId: string;
  packageId: string;
  routerId: string;
  startedAt: string;
  expiresAt: string;
  status: "active" | "expired" | "disconnected";
};

export type Payment = {
  id: string;
  customerId: string;
  packageId: string;
  amount: number;
  method: "mpesa" | "card" | "bank" | "other";
  status: "pending" | "successful" | "failed";
  transactionId?: string;
  createdAt: string;
};
