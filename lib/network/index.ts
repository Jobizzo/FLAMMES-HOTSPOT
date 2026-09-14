export type RouterConnection = {
  routerId: string;
  brand: string;
  address: string;
  username?: string;
  connected: boolean;
};

export interface RouterAdapter {
  connect(config: RouterConnection): Promise<boolean>;
  disconnect(routerId: string): Promise<boolean>;
  getStatus(routerId: string): Promise<string>;
  getActiveUsers(routerId: string): Promise<number>;
  authorizeUser(
    routerId: string,
    customerId: string,
    durationMinutes: number
  ): Promise<boolean>;
  disconnectUser(
    routerId: string,
    customerId: string
  ): Promise<boolean>;
}

export function getRouterAdapter(
  brand: string
): RouterAdapter | null {
  switch (brand.toLowerCase()) {
    case "mikrotik":
      return null;

    default:
      return null;
  }
}
