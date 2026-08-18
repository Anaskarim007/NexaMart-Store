/*
# Create storage buckets for images

1. Storage Buckets
- `product-images` — for product main images and gallery images
- `category-images` — for category images
- `site-content` — for homepage hero, promotional banner, about, contact images

2. Security
- All buckets are PUBLIC (readable by anyone) so images can be displayed on the storefront.
- Upload (INSERT) is admin-only: requires profile role = 'admin'.
- Update/Delete is admin-only.

3. Important Notes
1. Public read is necessary because product and category images must display on the storefront for anonymous visitors.
2. Only authenticated admins can upload, update, or delete images.
*/

-- Create buckets (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-content', 'site-content', true)
ON CONFLICT (id) DO NOTHING;

-- ============================
-- Storage Policies: product-images
-- ============================
DROP POLICY IF EXISTS "product_images_select_public" ON storage.objects;
CREATE POLICY "product_images_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_insert_admin" ON storage.objects;
CREATE POLICY "product_images_insert_admin"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "product_images_update_admin" ON storage.objects;
CREATE POLICY "product_images_update_admin"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "product_images_delete_admin" ON storage.objects;
CREATE POLICY "product_images_delete_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================
-- Storage Policies: category-images
-- ============================
DROP POLICY IF EXISTS "category_images_select_public" ON storage.objects;
CREATE POLICY "category_images_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'category-images');

DROP POLICY IF EXISTS "category_images_insert_admin" ON storage.objects;
CREATE POLICY "category_images_insert_admin"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'category-images'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "category_images_update_admin" ON storage.objects;
CREATE POLICY "category_images_update_admin"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'category-images'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  bucket_id = 'category-images'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "category_images_delete_admin" ON storage.objects;
CREATE POLICY "category_images_delete_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'category-images'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================
-- Storage Policies: site-content
-- ============================
DROP POLICY IF EXISTS "site_content_select_public" ON storage.objects;
CREATE POLICY "site_content_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'site-content');

DROP POLICY IF EXISTS "site_content_insert_admin" ON storage.objects;
CREATE POLICY "site_content_insert_admin"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'site-content'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "site_content_update_admin" ON storage.objects;
CREATE POLICY "site_content_update_admin"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'site-content'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  bucket_id = 'site-content'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "site_content_delete_admin" ON storage.objects;
CREATE POLICY "site_content_delete_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'site-content'
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
