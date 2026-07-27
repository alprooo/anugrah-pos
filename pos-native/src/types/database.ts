export interface Product {
  id: string;
  barcode: string | null;
  sku: string | null;
  name: string;
  description: string | null;
  price: number;
  cost: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  product_id: string;
  quantity_on_hand: number;
  reorder_threshold: number;
}

export interface ProductWithInventory extends Product {
  inventory: Inventory | null;
}

export interface Order {
  id: string;
  payment_method: string;
  total: number;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & { product_name?: string })[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'cash' | 'card' | 'qris';

export type UserRole = 'admin' | 'staff';

export interface CheckoutPayload {
  p_payment_method: PaymentMethod;
  p_items: {
    p_product_id: string;
    p_quantity: number;
  }[];
}
