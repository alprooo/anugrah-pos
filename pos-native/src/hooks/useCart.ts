import { useReducer, useCallback, useMemo } from 'react';
import type { CartItem, Product } from '../types/database';

type CartAction =
  | { type: 'ADD_ITEM'; product: Product; maxQuantity: number }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number; maxQuantity: number }
  | { type: 'CLEAR_CART' };

interface CartState {
  items: CartItem[];
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(
        (item) => item.product.id === action.product.id,
      );
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.product.id === action.product.id
              ? {
                  ...item,
                  quantity: Math.min(
                    item.quantity + 1,
                    action.maxQuantity,
                  ),
                }
              : item,
          ),
        };
      }
      return {
        items: [
          ...state.items,
          { product: action.product, quantity: 1 },
        ],
      };
    }
    case 'REMOVE_ITEM':
      return {
        items: state.items.filter(
          (item) => item.product.id !== action.productId,
        ),
      };
    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return {
          items: state.items.filter(
            (item) => item.product.id !== action.productId,
          ),
        };
      }
      return {
        items: state.items.map((item) =>
          item.product.id === action.productId
            ? {
                ...item,
                quantity: Math.min(action.quantity, action.maxQuantity),
              }
            : item,
        ),
      };
    }
    case 'CLEAR_CART':
      return { items: [] };
    default:
      return state;
  }
}

export function useCart(initialItems: CartItem[] = []) {
  const [state, dispatch] = useReducer(cartReducer, { items: initialItems });

  const addItem = useCallback(
    (product: Product, maxQuantity: number = 999) => {
      dispatch({ type: 'ADD_ITEM', product, maxQuantity });
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', productId });
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number, maxQuantity: number = 999) => {
      dispatch({ type: 'UPDATE_QUANTITY', productId, quantity, maxQuantity });
    },
    [],
  );

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const totalItems = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items],
  );

  const grandTotal = useMemo(
    () =>
      state.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      ),
    [state.items],
  );

  return {
    items: state.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    grandTotal,
  };
}
