export type DatabaseConfig = {
  url: string;
};

export function getDatabaseConfig(): DatabaseConfig {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return {
    url,
  };
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
