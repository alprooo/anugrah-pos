import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, ProductWithInventory } from '../types/database';

export function useProducts() {
  const [products, setProducts] = useState<ProductWithInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('products')
        .select('*, inventory(*)')
        .order('name');

      if (error) throw error;
      setProducts(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refetch: fetchProducts };
}

export function useProductByBarcode() {
  const [isChecking, setIsChecking] = useState(false);

  const findByBarcode = useCallback(
    async (barcode: string): Promise<Product | null> => {
      try {
        setIsChecking(true);
        const { data, error } = await supabase
          .from('products')
          .select('*, inventory(*)')
          .eq('barcode', barcode)
          .maybeSingle();

        if (error) throw error;
        return data as ProductWithInventory | null;
      } catch {
        return null;
      } finally {
        setIsChecking(false);
      }
    },
    [],
  );

  return { findByBarcode, isChecking };
}

export function useProductSearch() {
  const [results, setResults] = useState<ProductWithInventory[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    try {
      setIsSearching(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, inventory(*)')
        .or(
          `name.ilike.%${query}%,barcode.ilike.%${query}%,sku.ilike.%${query}%`,
        )
        .limit(20);

      if (error) throw error;
      setResults(data ?? []);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { results, isSearching, search };
}
