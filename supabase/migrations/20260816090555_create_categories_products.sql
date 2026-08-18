/*
# Create categories, products, and product_images tables

1. New Tables
- `categories`
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `slug` (text, unique, not null)
  - `description` (text, nullable)
  - `image_url` (text, nullable)
  - `active` (boolean, default true)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- `products`
  - `id` (uuid, primary key)
  - `name` (text, not null)
  - `slug` (text, unique, not null)
  - `description` (text, nullable)
  - `short_description` (text, nullable)
  - `category_id` (uuid, references categories, nullable, on delete set null)
  - `price` (numeric, not null, check >= 0)
  - `sale_price` (numeric, nullable, check >= 0)
  - `stock_quantity` (integer, not null, default 0, check >= 0)
  - `sku` (text, nullable)
  - `main_image_url` (text, nullable)
  - `featured` (boolean, default false)
  - `new_arrival` (boolean, default false)
  - `active` (boolean, default true)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

- `product_images`
  - `id` (uuid, primary key)
  - `product_id` (uuid, references products, on delete cascade)
  - `image_url` (text, not null)
  - `sort_order` (integer, default 0)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on all three tables.
- Public (anon + authenticated) can READ active categories and active products.
- Admin-only write for categories and products (enforced via RLS: only users with profile role='admin' can INSERT/UPDATE/DELETE).
- Public can read product_images for active products.
- Admin-only write for product_images.

3. Important Notes
1. Admin authorization is checked via a subquery: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin').
2. Only active categories and active products are visible to the public. Inactive ones are admin-only.
*/

-- ============================
-- CATEGORIES
-- ============================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
DROP POLICY IF EXISTS "categories_select_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_update_admin" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_admin" ON public.categories;

-- Public can read active categories
CREATE POLICY "categories_select_public"
ON public.categories FOR SELECT
TO anon, authenticated
USING (active = true);

-- Admin can read all categories (including inactive)
CREATE POLICY "categories_select_admin"
ON public.categories FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admin-only writes
CREATE POLICY "categories_insert_admin"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "categories_update_admin"
ON public.categories FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "categories_delete_admin"
ON public.categories FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================
-- PRODUCTS
-- ============================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  short_description text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  price numeric(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  sale_price numeric(12, 2) CHECK (sale_price >= 0),
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  sku text,
  main_image_url text,
  featured boolean NOT NULL DEFAULT false,
  new_arrival boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_select_public" ON public.products;
DROP POLICY IF EXISTS "products_select_admin" ON public.products;
DROP POLICY IF EXISTS "products_insert_admin" ON public.products;
DROP POLICY IF EXISTS "products_update_admin" ON public.products;
DROP POLICY IF EXISTS "products_delete_admin" ON public.products;

-- Public can read active products
CREATE POLICY "products_select_public"
ON public.products FOR SELECT
TO anon, authenticated
USING (active = true);

-- Admin can read all products
CREATE POLICY "products_select_admin"
ON public.products FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admin-only writes
CREATE POLICY "products_insert_admin"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "products_update_admin"
ON public.products FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "products_delete_admin"
ON public.products FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================
-- PRODUCT IMAGES
-- ============================
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_images_select_public" ON public.product_images;
DROP POLICY IF EXISTS "product_images_select_admin" ON public.product_images;
DROP POLICY IF EXISTS "product_images_insert_admin" ON public.product_images;
DROP POLICY IF EXISTS "product_images_update_admin" ON public.product_images;
DROP POLICY IF EXISTS "product_images_delete_admin" ON public.product_images;

-- Public can read images for active products
CREATE POLICY "product_images_select_public"
ON public.product_images FOR SELECT
TO anon, authenticated
USING (
  EXISTS (SELECT 1 FROM public.products WHERE id = product_id AND active = true)
);

-- Admin can read all product images
CREATE POLICY "product_images_select_admin"
ON public.product_images FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Admin-only writes
CREATE POLICY "product_images_insert_admin"
ON public.product_images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "product_images_update_admin"
ON public.product_images FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "product_images_delete_admin"
ON public.product_images FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================
-- INDEXES
-- ============================
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(active);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_new_arrival ON public.products(new_arrival) WHERE new_arrival = true;
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(active);

-- ============================
-- TRIGGERS for updated_at
-- ============================
DROP TRIGGER IF EXISTS categories_updated_at ON public.categories;
CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
