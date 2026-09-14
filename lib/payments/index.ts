export type PaymentRequest = {
  customerId: string;
  phone: string;
  amount: number;
  packageId: string;
};

export type PaymentResult = {
  success: boolean;
  status: "pending" | "successful" | "failed";
  transactionId?: string;
  message: string;
};

export interface PaymentProvider {
  initiatePayment(
    request: PaymentRequest
  ): Promise<PaymentResult>;

  verifyPayment(
    transactionId: string
  ): Promise<PaymentResult>;
}

export function getPaymentProvider(
  provider: string
): PaymentProvider | null {
  switch (provider.toLowerCase()) {
    case "mpesa":
      return null;

    default:
      return null;
  }
}
