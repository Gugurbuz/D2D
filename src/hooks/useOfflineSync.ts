import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export type ConnectionStatus = 'online' | 'offline' | 'reconnecting';

export interface QueuedOperation {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface OfflineSyncConfig {
  maxRetries: number;
  retryDelay: number;
  enableIndexedDB: boolean;
}

const DB_NAME = 'ContractOfflineDB';
const STORE_NAME = 'syncQueue';
const DB_VERSION = 1;

export const useOfflineSync = (
  salesRepId: string,
  config: Partial<OfflineSyncConfig> = {}
) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('online');
  const [queuedOperations, setQueuedOperations] = useState<QueuedOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });

  const dbRef = useRef<IDBDatabase | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const defaultConfig: OfflineSyncConfig = {
    maxRetries: 3,
    retryDelay: 2000,
    enableIndexedDB: true,
    ...config,
  };

  const initIndexedDB = useCallback(async (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }, []);

  const loadQueueFromIndexedDB = useCallback(async () => {
    if (!defaultConfig.enableIndexedDB || !dbRef.current) return;

    try {
      const transaction = dbRef.current.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        setQueuedOperations(request.result || []);
      };
    } catch (err) {
      console.error('Failed to load queue from IndexedDB:', err);
    }
  }, [defaultConfig.enableIndexedDB]);

  const saveQueueToIndexedDB = useCallback(
    async (operations: QueuedOperation[]) => {
      if (!defaultConfig.enableIndexedDB || !dbRef.current) return;

      try {
        const transaction = dbRef.current.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        store.clear();

        operations.forEach((op) => {
          store.add(op);
        });
      } catch (err) {
        console.error('Failed to save queue to IndexedDB:', err);
      }
    },
    [defaultConfig.enableIndexedDB]
  );

  const addToQueue = useCallback(
    async (type: string, data: any) => {
      const operation: QueuedOperation = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      };

      setQueuedOperations((prev) => {
        const newQueue = [...prev, operation];
        saveQueueToIndexedDB(newQueue);
        return newQueue;
      });

      if (connectionStatus === 'online') {
        await processQueue();
      }

      return operation.id;
    },
    [connectionStatus, saveQueueToIndexedDB]
  );

  const removeFromQueue = useCallback(
    (operationId: string) => {
      setQueuedOperations((prev) => {
        const newQueue = prev.filter((op) => op.id !== operationId);
        saveQueueToIndexedDB(newQueue);
        return newQueue;
      });
    },
    [saveQueueToIndexedDB]
  );

  const syncOperationToSupabase = async (operation: QueuedOperation): Promise<boolean> => {
    try {
      const queueData = {
        sales_rep_id: salesRepId,
        operation_type: operation.type,
        operation_data: operation.data,
        status: 'pending',
        retry_count: operation.retryCount,
        created_at: new Date(operation.timestamp).toISOString(),
      };

      const { error } = await supabase.from('offline_sync_queue').insert(queueData);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Failed to sync operation to Supabase:', err);
      return false;
    }
  };

  const processQueue = useCallback(async () => {
    if (isSyncing || queuedOperations.length === 0 || connectionStatus !== 'online') {
      return;
    }

    setIsSyncing(true);
    setSyncProgress({ current: 0, total: queuedOperations.length });

    const operationsToProcess = [...queuedOperations];

    for (let i = 0; i < operationsToProcess.length; i++) {
      const operation = operationsToProcess[i];
      setSyncProgress({ current: i + 1, total: operationsToProcess.length });

      const success = await syncOperationToSupabase(operation);

      if (success) {
        removeFromQueue(operation.id);
      } else {
        if (operation.retryCount < defaultConfig.maxRetries) {
          setQueuedOperations((prev) =>
            prev.map((op) =>
              op.id === operation.id ? { ...op, retryCount: op.retryCount + 1 } : op
            )
          );
        } else {
          console.error('Max retries reached for operation:', operation);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsSyncing(false);
    setSyncProgress({ current: 0, total: 0 });
  }, [
    isSyncing,
    queuedOperations,
    connectionStatus,
    defaultConfig.maxRetries,
    removeFromQueue,
    salesRepId,
  ]);

  const manualSync = useCallback(async () => {
    if (connectionStatus === 'online') {
      await processQueue();
    }
  }, [connectionStatus, processQueue]);

  const clearQueue = useCallback(() => {
    setQueuedOperations([]);
    if (dbRef.current) {
      const transaction = dbRef.current.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.clear();
    }
  }, []);

  useEffect(() => {
    const initDB = async () => {
      if (defaultConfig.enableIndexedDB) {
        try {
          dbRef.current = await initIndexedDB();
          await loadQueueFromIndexedDB();
        } catch (err) {
          console.error('Failed to initialize IndexedDB:', err);
        }
      }
    };

    initDB();

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
      }
    };
  }, [defaultConfig.enableIndexedDB, initIndexedDB, loadQueueFromIndexedDB]);

  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('online');
      processQueue();
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setConnectionStatus(navigator.onLine ? 'online' : 'offline');

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [processQueue]);

  useEffect(() => {
    if (connectionStatus === 'online' && queuedOperations.length > 0) {
      syncIntervalRef.current = setInterval(() => {
        processQueue();
      }, 30000);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [connectionStatus, queuedOperations.length, processQueue]);

  return {
    connectionStatus,
    queuedOperations,
    isSyncing,
    syncProgress,
    addToQueue,
    manualSync,
    clearQueue,
    isOffline: connectionStatus === 'offline',
    hasQueuedItems: queuedOperations.length > 0,
  };
};
