/**
 * High-performance In-Memory Cache with TTL & Tenant Isolation for Team Pulse
 * Eliminates redundant database aggregations across Dashboard, Compliance, Attrition, etc.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export const CacheKeys = {
  dashboard: (orgId: string) => `tp:${orgId}:dashboard`,
  compliance: (orgId: string) => `tp:${orgId}:compliance`,
  attrition: (orgId: string, dept = "all", level = "all") => `tp:${orgId}:attrition:${dept}:${level}`,
  performance: (orgId: string, dept = "all") => `tp:${orgId}:performance:${dept}`,
  engagement: (orgId: string) => `tp:${orgId}:engagement`,
  fairness: (orgId: string) => `tp:${orgId}:fairness`,
  aiResponse: (hash: string) => `tp:ai:${hash}`,
};

export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlSeconds = 60): void {
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function invalidateCache(prefix: string): void {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }
}

export function invalidateOrgCache(orgId: string): void {
  invalidateCache(`tp:${orgId}:`);
}
