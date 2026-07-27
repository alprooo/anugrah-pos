import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Order, OrderWithItems } from '../types/database';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, isLoading, error, refetch: fetchOrders };
}

export function useOrderDetail() {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetail = useCallback(async (orderId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, products(name)')
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      setOrder({
        ...orderData,
        items: (itemsData ?? []).map((item: any) => ({
          ...item,
          product_name: item.products?.name,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { order, isLoading, error, fetchOrderDetail };
}
