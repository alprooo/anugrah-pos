import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Inventory } from '../types/database';

export function useInventory() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('inventory')
        .select('*');

      if (error) throw error;
      setInventory(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inventory');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        () => {
          fetchInventory();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInventory]);

  return { inventory, isLoading, error, refetch: fetchInventory };
}
