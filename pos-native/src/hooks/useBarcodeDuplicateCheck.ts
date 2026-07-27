import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { DEBOUNCE_MS } from '../lib/constants';

interface DuplicateResult {
  isDuplicate: boolean;
  existingProductName: string | null;
  existingProductId: string | null;
}

export function useBarcodeDuplicateCheck(
  barcode: string,
  excludeProductId?: string | null,
) {
  const [result, setResult] = useState<DuplicateResult>({
    isDuplicate: false,
    existingProductName: null,
    existingProductId: null,
  });
  const [isChecking, setIsChecking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!barcode || barcode.length < 3) {
      setResult({ isDuplicate: false, existingProductName: null, existingProductId: null });
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        setIsChecking(true);
        let query = supabase
          .from('products')
          .select('id, name')
          .eq('barcode', barcode);

        if (excludeProductId) {
          query = query.neq('id', excludeProductId);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        setResult({
          isDuplicate: !!data,
          existingProductName: data?.name ?? null,
          existingProductId: data?.id ?? null,
        });
      } catch {
        setResult({ isDuplicate: false, existingProductName: null, existingProductId: null });
      } finally {
        setIsChecking(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [barcode, excludeProductId]);

  return { ...result, isChecking };
}
