-- Precision POS — Supabase Schema Migration
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)

-- 1. Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  cost INTEGER CHECK (cost >= 0),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Inventory
CREATE TABLE IF NOT EXISTS public.inventory (
  product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  reorder_threshold INTEGER NOT NULL DEFAULT 5 CHECK (reorder_threshold >= 0)
);

-- 3. Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'qris')),
  total INTEGER NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0)
);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 6. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 7. process_checkout RPC
CREATE OR REPLACE FUNCTION public.process_checkout(
  p_payment_method TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_total INTEGER := 0;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_price INTEGER;
  v_current_stock INTEGER;
  v_errors JSONB := '[]'::JSONB;
BEGIN
  -- Validate payment method
  IF p_payment_method NOT IN ('cash', 'card', 'qris') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid payment method');
  END IF;

  -- Validate items array
  IF jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No items in order');
  END IF;

  -- Create the order
  INSERT INTO public.orders (payment_method, total)
  VALUES (p_payment_method, 0)
  RETURNING id INTO v_order_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'p_product_id')::UUID;
    v_quantity := (v_item->>'p_quantity')::INTEGER;

    -- Get product price
    SELECT price INTO v_price
    FROM public.products
    WHERE id = v_product_id;

    IF NOT FOUND THEN
      v_errors := v_errors || jsonb_build_object(
        'product_id', v_product_id,
        'error', 'Product not found'
      );
      CONTINUE;
    END IF;

    -- Check stock
    SELECT quantity_on_hand INTO v_current_stock
    FROM public.inventory
    WHERE product_id = v_product_id;

    IF v_current_stock IS NULL OR v_current_stock < v_quantity THEN
      v_errors := v_errors || jsonb_build_object(
        'product_id', v_product_id,
        'error', 'Insufficient stock',
        'available', v_current_stock,
        'requested', v_quantity
      );
      CONTINUE;
    END IF;

    -- Deduct stock
    UPDATE public.inventory
    SET quantity_on_hand = quantity_on_hand - v_quantity
    WHERE product_id = v_product_id;

    -- Insert order item
    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (v_order_id, v_product_id, v_quantity, v_price);

    v_total := v_total + (v_price * v_quantity);
  END LOOP;

  -- Update order total
  UPDATE public.orders SET total = v_total WHERE id = v_order_id;

  -- If all items had errors, rollback
  IF jsonb_array_length(v_errors) = jsonb_array_length(p_items) THEN
    DELETE FROM public.orders WHERE id = v_order_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'All items failed validation',
      'errors', v_errors
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total', v_total,
    'errors', v_errors
  );
END;
$$;

-- 8. Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read products & inventory
CREATE POLICY "Authenticated users can read products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read inventory"
  ON public.inventory FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to read & create orders
CREATE POLICY "Authenticated users can read orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read order_items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (true);

-- Admin-only: insert/update/delete products & inventory
CREATE POLICY "Admin can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "Admin can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "Admin can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "Admin can insert inventory"
  ON public.inventory FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "Admin can update inventory"
  ON public.inventory FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

-- 9. Storage bucket for product images
-- Run this separately in the Supabase Dashboard:
-- 1. Go to Storage → Create a new bucket called "product-images"
-- 2. Set it to "public" (or private with the policy below)

-- Policy for product-images bucket (create after bucket exists):
-- CREATE POLICY "Public read access"
--   ON storage.objects FOR SELECT
--   TO public
--   USING (bucket_id = 'product-images');
--
-- CREATE POLICY "Authenticated upload access"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'product-images');
