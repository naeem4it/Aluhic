import { useEffect, useState, useCallback } from 'react';
import { isOnline, onOnline, getSyncQueue, removeFromSyncQueue, onOffline, initOfflineDB } from '@/lib/offline';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useOfflineSync() {
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const syncData = useCallback(async () => {
    setSyncing(true);
    try {
      const syncQueue = await getSyncQueue();
      
      if (syncQueue && syncQueue.length > 0) {
        toast({
          title: "Syncing data...",
          description: `${syncQueue.length} items to sync`,
        });

        let successCount = 0;
        for (const item of syncQueue) {
          try {
            await apiRequest(item.method, item.endpoint, item.data);
            await removeFromSyncQueue(item.id);
            successCount++;
          } catch (error) {
            console.error('Sync failed for:', item.endpoint, error);
          }
        }

        if (successCount > 0) {
          toast({
            title: "Sync complete",
            description: `${successCount} items synced successfully`,
          });
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  }, [toast]);

  useEffect(() => {
    initOfflineDB().catch(() => {});

    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {});

    const unsubscribeOnline = onOnline(async () => {
      setOnline(true);
      toast({
        title: "Back online",
        description: "Syncing offline changes...",
      });
      await syncData();
    });

    const unsubscribeOffline = onOffline(() => {
      setOnline(false);
      toast({
        title: "You are offline",
        description: "Changes will be saved locally and synced when back online",
        variant: "destructive",
      });
    });

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, [syncData, toast]);

  return { online, syncing, syncData };
}
