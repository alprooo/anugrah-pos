import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { PaymentMethod, CartItem } from '../types/database';

export function useCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processCheckout = useCallback(
    async (
      paymentMethod: PaymentMethod,
      cartItems: CartItem[],
    ): Promise<boolean> => {
      try {
        setIsProcessing(true);
        setError(null);

        const p_items = cartItems.map((item) => ({
          p_product_id: item.product.id,
          p_quantity: item.quantity,
        }));

        const { error: rpcError } = await supabase.rpc('process_checkout', {
          p_payment_method: paymentMethod,
          p_items,
        });

        if (rpcError) throw rpcError;
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Checkout failed';
        setError(message);
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
    [],
  );

  return { processCheckout, isProcessing, error, clearError: () => setError(null) };
}
