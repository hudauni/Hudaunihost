// Simple in-memory cache to speed up repeated visits
const cache: Record<string, { data: any; expiry: number }> = {};

export const getCache = (key: string) => {
  const item = cache[key];
  if (!item) return null;
  if (Date.now() > item.expiry) {
    delete cache[key];
    return null;
  }
  return item.data;
};

export const setCache = (key: string, data: any, ttlMinutes: number = 5) => {
  cache[key] = {
    data,
    expiry: Date.now() + ttlMinutes * 60 * 1000,
  };
};
