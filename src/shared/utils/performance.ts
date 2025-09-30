import { useCallback, useRef } from 'react';

// Throttle function calls
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return callback(...args);
    }
  }, [callback, delay]) as T;
}

// Debounce function calls
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]) as T;
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const observer = useRef<IntersectionObserver>();
  
  const observe = useCallback((element: Element) => {
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(callback, options);
    observer.current.observe(element);
    
    return () => observer.current?.disconnect();
  }, [callback, options]);
  
  return observe;
}

// Memory usage monitoring (development only)
export function useMemoryMonitor() {
  const checkMemory = useCallback(() => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memory = (performance as any).memory;
      console.log('Memory Usage:', {
        used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
        total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
        limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`,
      });
    }
  }, []);
  
  return checkMemory;
}

// Bundle size analyzer
export function logBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    import('./bundleAnalysis').then(({ analyzeBundleSize }) => {
      analyzeBundleSize();
    });
  }
}