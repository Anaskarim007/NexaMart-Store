/*
# Create HHC, order_margin_tracking, email_notifications, and site_content tables

1. New Tables
- `hhc_products`
  - `id` (uuid, primary key)
  - `product_id` (uuid, unique, references products, on delete cascade)
  - `hhc_product_id` (text, nullable — HHC's own product identifier)
  - `product_selling_price` (numeric, not null)
  - `hhc_price` (numeric, not null)
  - `my_margin` (numeric, not null — auto-calculated or manually set)
  - `manual_margin` (boolean, default false — true if margin was manually overridden)
  - `status` (text, not null, default 'active' — 'active' or 'inactive')
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- `order_margin_tracking`
  - `id` (uuid, primary key)
  - `order_id` (uuid, references orders, on delete cascade)
  - `product_id` (uuid, references products, on delete set null)
  - `order_item_id` (uuid, references order_items, on delete set null)
  - `quantity` (integer, not null)
  - `margin_per_item` (numeric, not null)
  - `total_margin` (numeric, not null)
  - `included_in_total` (boolean, not null, default true — false when order is cancelled)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- `email_notifications`
  - `id` (uuid, primary key)
  - `order_id` (uuid, references orders, on delete cascade)
  - `email_sent` (boolean, default false)
  - `error_message` (text, nullable)
  - `sent_at` (timestamptz, nullable)
  - `created_at` (timestamptz, default now())

- `site_content`
  - `id` (uuid, primary key)
  - `key` (text, unique, not null — e.g. 'hero_image', 'promo_banner', 'about_image', 'contact_image')
  - `image_url` (text, nullable)
  - `updated_at` (timestamptz, default now())

2. Security
- HHC products: ADMIN-ONLY. No public access whatsoever. RLS denies all anon access, only admin can SELECT/INSERT/UPDATE/DELETE.
- Order margin tracking: ADMIN-ONLY. Same strict admin-only access.
- Email notifications: ADMIN-ONLY.
- Site content: Public can SELECT (to display images). Admin can INSERT/UPDATE/DELETE.

3. Important Notes
1. HHC data is strictly private — customers must NEVER access it. All policies check for admin role.
2. The unique constraint on hhc_products.product_id prevents duplicate HHC records per product.
3. order_margin_tracking.included_in_total is the flag that controls whether margin is counted in the dashboard total. When an order is cancelled, it's set to false; when restored, set back to true.
4. site_content stores URLs for managed images (hero, banner, about, contact).
*/

-- ============================
-- HHC PRODUCTS (ADMIN-ONLY)
-- ============================
CREATE TABLE IF NOT EXISTS public.hhc_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid UNIQUE NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  hhc_product_id text,
  product_selling_price numeric(12, 2) NOT NULL DEFAULT 0 CHECK (product_selling_price >= 0),
  hhc_price numeric(12, 2) NOT NULL DEFAULT 0 CHECK (hhc_price >= 0),
  my_margin numeric(12, 2) NOT NULL DEFAULT 0,
  manual_margin boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hhc_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hhc_select_admin" ON public.hhc_products;
DROP POLICY IF EXISTS "hhc_insert_admin" ON public.hhc_products;
DROP POLICY IF EXISTS "hhc_update_admin" ON public.hhc_products;
DROP POLICY IF EXISTS "hhc_delete_admin" ON public.hhc_products;

-- Admin-only: all operations
CREATE POLICY "hhc_select_admin"
ON public.hhc_products FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "hhc_insert_admin"
ON public.hhc_products FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "hhc_update_admin"
ON public.hhc_products FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "hhc_delete_admin"
ON public.hhc_products FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================
-- ORDER MARGIN TRACKING (ADMIN-ONLY)
-- ============================
CREATE TABLE IF NOT EXISTS public.order_margin_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  order_item_id uuid REFERENCES public.order_items(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  margin_per_item numeric(12, 2) NOT NULL DEFAULT 0,
  total_margin numeric(12, 2) NOT NULL DEFAULT 0,
  included_in_total boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_margin_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "margin_select_admin" ON public.order_margin_tracking;
DROP POLICY IF EXISTS "margin_insert_admin" ON public.order_margin_tracking;
DROP POLICY IF EXISTS "margin_update_admin" ON public.order_margin_tracking;
DROP POLICY IF EXISTS "margin_delete_admin" ON public.order_margin_tracking;

CREATE POLICY "margin_select_admin"
ON public.order_margin_tracking FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "margin_insert_admin"
ON public.order_margin_tracking FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "margin_update_admin"
ON public.order_margin_tracking FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "margin_delete_admin"
ON public.order_margin_tracking FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================
-- EMAIL NOTIFICATIONS (ADMIN-ONLY)
-- ============================
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  email_sent boolean NOT NULL DEFAULT false,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_notif_select_admin" ON public.email_notifications;
DROP POLICY IF EXISTS "email_notif_insert_admin" ON public.email_notifications;
DROP POLICY IF EXISTS "email_notif_update_admin" ON public.email_notifications;

CREATE POLICY "email_notif_select_admin"
ON public.email_notifications FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "email_notif_insert_admin"
ON public.email_notifications FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "email_notif_update_admin"
ON public.email_notifications FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================
-- SITE CONTENT (public read, admin write)
-- ============================
CREATE TABLE IF NOT EXISTS public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  image_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_content_select_public" ON public.site_content;
DROP POLICY IF EXISTS "site_content_insert_admin" ON public.site_content;
DROP POLICY IF EXISTS "site_content_update_admin" ON public.site_content;
DROP POLICY IF EXISTS "site_content_delete_admin" ON public.site_content;

-- Public can read site content (to display images)
CREATE POLICY "site_content_select_public"
ON public.site_content FOR SELECT
TO anon, authenticated
USING (true);

-- Admin-only writes
CREATE POLICY "site_content_insert_admin"
ON public.site_content FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "site_content_update_admin"
ON public.site_content FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "site_content_delete_admin"
ON public.site_content FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================
-- INDEXES
-- ============================
CREATE INDEX IF NOT EXISTS idx_hhc_product_id ON public.hhc_products(product_id);
CREATE INDEX IF NOT EXISTS idx_margin_order_id ON public.order_margin_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_margin_included ON public.order_margin_tracking(included_in_total);
CREATE INDEX IF NOT EXISTS idx_email_notif_order_id ON public.email_notifications(order_id);

-- ============================
-- TRIGGERS
-- ============================
DROP TRIGGER IF EXISTS hhc_products_updated_at ON public.hhc_products;
CREATE TRIGGER hhc_products_updated_at
  BEFORE UPDATE ON public.hhc_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS order_margin_updated_at ON public.order_margin_tracking;
CREATE TRIGGER order_margin_updated_at
  BEFORE UPDATE ON public.order_margin_tracking
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS site_content_updated_at ON public.site_content;
CREATE TRIGGER site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================
-- SEED SITE CONTENT KEYS
-- ============================
INSERT INTO public.site_content (key, image_url) VALUES
  ('hero_image', NULL),
  ('promo_banner', NULL),
  ('about_image', NULL),
  ('contact_image', NULL)
ON CONFLICT (key) DO NOTHING;
