/*
# Create orders, order_items, contact_messages tables

1. New Tables
- `orders`
  - `id` (uuid, primary key)
  - `order_number` (text, unique, not null — human-readable order ID)
  - `customer_name` (text, not null)
  - `customer_email` (text, not null)
  - `customer_phone` (text, not null)
  - `shipping_address` (text, not null)
  - `shipping_city` (text, not null)
  - `shipping_postal_code` (text, not null)
  - `shipping_country` (text, not null)
  - `subtotal` (numeric, not null)
  - `shipping_cost` (numeric, not null, default 0 — free delivery)
  - `total` (numeric, not null)
  - `payment_method` (text, not null, default 'Cash on Delivery')
  - `status` (text, not null, default 'pending')
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- `order_items`
  - `id` (uuid, primary key)
  - `order_id` (uuid, references orders, on delete cascade)
  - `product_id` (uuid, references products, on delete set null)
  - `product_name` (text, not null)
  - `product_price` (numeric, not null)
  - `quantity` (integer, not null, check > 0)
  - `line_total` (numeric, not null)
  - `created_at` (timestamptz, default now())

- `contact_messages`
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `email` (text, not null)
  - `phone` (text, nullable)
  - `message` (text, not null)
  - `read` (boolean, default false)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on all three tables.
- Orders: public (anon) can INSERT (guest checkout). Admin can SELECT/UPDATE. Public can SELECT by order_number (for order confirmation page) — but NOT list all orders.
- Order items: public can SELECT items for their own order (by order_number). Admin can SELECT all.
- Contact messages: public can INSERT. Admin-only SELECT/UPDATE/DELETE.

3. Important Notes
1. Orders use a human-readable order_number (e.g., NEX-XXXXXX) generated server-side.
2. Public order lookup is by order_number only, not by listing — prevents data leakage.
3. Order status values: pending, confirmed, processing, shipped, delivered, cancelled.
*/

-- ============================
-- ORDERS
-- ============================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text NOT NULL,
  shipping_postal_code text NOT NULL,
  shipping_country text NOT NULL,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  shipping_cost numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'Cash on Delivery',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_insert_public" ON public.orders;
DROP POLICY IF EXISTS "orders_select_public" ON public.orders;
DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin" ON public.orders;

-- Public can insert orders (guest checkout)
CREATE POLICY "orders_insert_public"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Public can look up their own order by order_number (single order lookup, not listing)
-- This is handled via a SECURITY DEFINER function to prevent listing all orders
-- For now, public SELECT is restricted — the lookup function handles it
-- Admin can see all orders
CREATE POLICY "orders_select_admin"
ON public.orders FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admin can update order status
CREATE POLICY "orders_update_admin"
ON public.orders FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admin can delete orders
CREATE POLICY "orders_delete_admin"
ON public.orders FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================
-- ORDER ITEMS
-- ============================
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_price numeric(12, 2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  line_total numeric(12, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_select_admin" ON public.order_items;
DROP POLICY IF EXISTS "order_items_insert_public" ON public.order_items;

-- Admin can read all order items
CREATE POLICY "order_items_select_admin"
ON public.order_items FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Public can insert order items (guest checkout)
CREATE POLICY "order_items_insert_public"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ============================
-- CONTACT MESSAGES
-- ============================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_insert_public" ON public.contact_messages;
DROP POLICY IF EXISTS "messages_select_admin" ON public.contact_messages;
DROP POLICY IF EXISTS "messages_update_admin" ON public.contact_messages;
DROP POLICY IF EXISTS "messages_delete_admin" ON public.contact_messages;

-- Public can submit contact messages
CREATE POLICY "messages_insert_public"
ON public.contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admin can read, update, delete messages
CREATE POLICY "messages_select_admin"
ON public.contact_messages FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "messages_update_admin"
ON public.contact_messages FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "messages_delete_admin"
ON public.contact_messages FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================
-- INDEXES
-- ============================
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.contact_messages(read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.contact_messages(created_at DESC);

-- ============================
-- TRIGGERS
-- ============================
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
