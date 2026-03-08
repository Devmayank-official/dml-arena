import { useState, useEffect, useCallback } from 'react';

const CACHE_PREFIX = 'dmlarena-offline-';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedData<T> {
  data: T;
  timestamp: number;
}

export function useOfflineCache<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `${CACHE_PREFIX}${key}`;

  const loadFromCache = useCallback((): T | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed: CachedData<T> = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_EXPIRY) {
          return parsed.data;
        }
        // Cache expired, remove it
        localStorage.removeItem(cacheKey);
      }
    } catch {
      // Cache load error - silent
    }
    return null;
  }, [cacheKey]);

  const saveToCache = useCallback((data: T) => {
    try {
      const cacheData: CachedData<T> = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Error saving to cache:', e);
    }
  }, [cacheKey]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // Try to load from cache first
    const cachedData = loadFromCache();
    if (cachedData) {
      setData(cachedData);
      setIsFromCache(true);
    }

    // If online, fetch fresh data
    if (navigator.onLine) {
      try {
        const freshData = await fetcher();
        setData(freshData);
        setIsFromCache(false);
        saveToCache(freshData);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to fetch data';
        setError(message);
        // If we have cached data, we can still use it
        if (!cachedData) {
          setData(null);
        }
      }
    } else if (!cachedData) {
      setError('You are offline and no cached data is available');
    }

    setIsLoading(false);
  }, [fetcher, loadFromCache, saveToCache]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const clearCache = useCallback(() => {
    localStorage.removeItem(cacheKey);
  }, [cacheKey]);

  return {
    data,
    isLoading,
    isFromCache,
    error,
    refresh,
    clearCache,
  };
}

// Clear all expired caches
export function cleanupOfflineCache() {
  const keys = Object.keys(localStorage);
  const now = Date.now();

  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (now - parsed.timestamp >= CACHE_EXPIRY) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        // Remove corrupted cache entries
        localStorage.removeItem(key);
      }
    }
  });
}

// Get cache statistics
export function getOfflineCacheStats() {
  const keys = Object.keys(localStorage);
  let totalSize = 0;
  let itemCount = 0;

  keys.forEach(key => {
    if (key.startsWith(CACHE_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length * 2; // Approximate size in bytes (UTF-16)
        itemCount++;
      }
    }
  });

  return {
    itemCount,
    totalSizeBytes: totalSize,
    totalSizeKB: Math.round(totalSize / 1024),
  };
}
