// Bundle analysis utilities for development
export function analyzeBundleSize() {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group('📦 Bundle Analysis');
  
  // Analyze loaded modules
  const modules = Object.keys(window as any).filter(key => 
    key.startsWith('__') || key.includes('module')
  );
  
  console.log('Loaded modules:', modules.length);
  
  // Memory estimation
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log('Memory usage:', {
      used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
    });
  }
  
  // Performance marks
  const marks = performance.getEntriesByType('mark');
  const measures = performance.getEntriesByType('measure');
  
  if (marks.length > 0) {
    console.log('Performance marks:', marks.map(m => m.name));
  }
  
  if (measures.length > 0) {
    console.log('Performance measures:', measures.map(m => ({
      name: m.name,
      duration: `${m.duration.toFixed(2)}ms`
    })));
  }
  
  console.groupEnd();
}

export function markPerformance(name: string) {
  if (process.env.NODE_ENV === 'development') {
    performance.mark(name);
  }
}

export function measurePerformance(name: string, startMark: string, endMark?: string) {
  if (process.env.NODE_ENV === 'development') {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
    } catch (error) {
      console.warn('Performance measurement failed:', error);
    }
  }
}