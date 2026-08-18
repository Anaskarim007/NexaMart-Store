/*
# Create secure database functions for order placement, order lookup, and order status updates

1. Functions Created
- `generate_order_number()` — generates a unique human-readable order number (NEX-XXXXXX format)
- `place_order(p_items jsonb, p_customer jsonb)` — creates an order with order_items, recomputes prices server-side, decrements stock, records margin tracking data. Returns the order with items.
- `get_order_by_number(p_order_number text)` — public function to look up a single order by order_number (for the order confirmation page). Returns order + items. Does NOT expose HHC or margin data.
- `update_order_status(p_order_id uuid, p_status text)` — admin-only function to update order status. Handles margin inclusion/exclusion correctly:
  - If new status is 'cancelled': set included_in_total = false on all margin rows for this order (removes margin from dashboard total).
  - If new status is NOT 'cancelled' and was previously cancelled: set included_in_total = true (re-adds margin).
  - Idempotent: no duplicate additions or subtractions.
- `get_dashboard_stats()` — admin-only function returning total products, total orders, pending, completed, cancelled, total sales, and total margin (from non-cancelled orders).

2. Security
- `place_order`: callable by anon + authenticated (guest checkout). Recomputes all prices from the database — never trusts client-supplied prices. Validates stock. Decrements stock atomically.
- `get_order_by_number`: callable by anon (public order lookup). Returns only public order data — no HHC, no margin info.
- `update_order_status`: admin-only. Verifies caller is admin via auth.uid() profile check. Handles margin tracking atomically.
- `get_dashboard_stats`: admin-only. Returns aggregate stats including total margin.

3. Important Notes
1. place_order accepts items as jsonb: [{product_id, quantity}, ...]. Prices are looked up from the products table server-side.
2. The function creates order_items, decrements stock, and inserts margin tracking rows all in one transaction.
3. Margin tracking rows are only created for products that have HHC data. If no HHC data exists for a product, margin_per_item = 0.
4. update_order_status correctly handles all status transitions without duplicate margin adjustments.
*/

-- ============================
-- Generate order number
-- ============================
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order_number text;
  v_exists boolean;
BEGIN
  LOOP
    v_order_number := 'NEX-' || upper(substr(encode(gen_random_bytes(4), 'hex'), 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = v_order_number) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_order_number;
    END IF;
  END LOOP;
END;
$$;

-- ============================
-- Place order (guest checkout)
-- ============================
CREATE OR REPLACE FUNCTION public.place_order(
  p_items jsonb,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address text,
  p_shipping_city text,
  p_shipping_postal_code text,
  p_shipping_country text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_order_item_id uuid;
  v_item jsonb;
  v_product record;
  v_line_total numeric;
  v_subtotal numeric := 0;
  v_shipping_cost numeric := 0;
  v_total numeric;
  v_effective_price numeric;
  v_margin_per_item numeric;
  v_hhc record;
  v_items_result jsonb := '[]'::jsonb;
BEGIN
  -- Validate items
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'No items in order';
  END IF;

  -- Validate customer info
  IF p_customer_name IS NULL OR p_customer_email IS NULL OR p_customer_phone IS NULL
     OR p_shipping_address IS NULL OR p_shipping_city IS NULL
     OR p_shipping_postal_code IS NULL OR p_shipping_country IS NULL THEN
    RAISE EXCEPTION 'Missing customer information';
  END IF;

  -- Generate order number
  v_order_number := public.generate_order_number();

  -- First pass: validate all products and compute subtotal
  FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
    SELECT id, name, price, sale_price, stock_quantity, active, slug
    INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::uuid AND active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found or inactive: %', v_item->>'product_id';
    END IF;

    IF v_product.stock_quantity < (v_item->>'quantity')::integer THEN
      RAISE EXCEPTION 'Insufficient stock for product: %', v_product.name;
    END IF;

    v_effective_price := COALESCE(v_product.sale_price, v_product.price);
    v_line_total := v_effective_price * (v_item->>'quantity')::integer;
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  v_total := v_subtotal + v_shipping_cost;

  -- Create the order
  INSERT INTO public.orders (
    order_number, customer_name, customer_email, customer_phone,
    shipping_address, shipping_city, shipping_postal_code, shipping_country,
    subtotal, shipping_cost, total, payment_method, status
  ) VALUES (
    v_order_number, p_customer_name, p_customer_email, p_customer_phone,
    p_shipping_address, p_shipping_city, p_shipping_postal_code, p_shipping_country,
    v_subtotal, v_shipping_cost, v_total, 'Cash on Delivery', 'pending'
  )
  RETURNING id INTO v_order_id;

  -- Second pass: create order items, decrement stock, track margin
  FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
    SELECT id, name, price, sale_price, stock_quantity, slug
    INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::uuid
    FOR UPDATE;

    v_effective_price := COALESCE(v_product.sale_price, v_product.price);
    v_line_total := v_effective_price * (v_item->>'quantity')::integer;

    -- Create order item
    INSERT INTO public.order_items (order_id, product_id, product_name, product_price, quantity, line_total)
    VALUES (v_order_id, v_product.id, v_product.name, v_effective_price, (v_item->>'quantity')::integer, v_line_total)
    RETURNING id INTO v_order_item_id;

    -- Decrement stock
    UPDATE public.products
    SET stock_quantity = stock_quantity - (v_item->>'quantity')::integer
    WHERE id = v_product.id;

    -- Check for HHC data and create margin tracking
    SELECT * INTO v_hhc FROM public.hhc_products WHERE product_id = v_product.id;

    IF FOUND THEN
      v_margin_per_item := v_hhc.my_margin;
      INSERT INTO public.order_margin_tracking (
        order_id, product_id, order_item_id, quantity,
        margin_per_item, total_margin, included_in_total
      ) VALUES (
        v_order_id, v_product.id, v_order_item_id, (v_item->>'quantity')::integer,
        v_margin_per_item, v_margin_per_item * (v_item->>'quantity')::integer, true
      );
    END IF;

    v_items_result := v_items_result || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'product_price', v_effective_price,
      'quantity', (v_item->>'quantity')::integer,
      'line_total', v_line_total
    );
  END LOOP;

  -- Return order data (no HHC/margin info)
  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'shipping_cost', v_shipping_cost,
    'total', v_total,
    'status', 'pending',
    'payment_method', 'Cash on Delivery',
    'items', v_items_result
  );
END;
$$;

-- Grant execute to anon and authenticated (guest checkout)
REVOKE EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, text, text, text, text) TO anon, authenticated;

-- ============================
-- Get order by number (public lookup)
-- ============================
CREATE OR REPLACE FUNCTION public.get_order_by_number(p_order_number text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order record;
  v_items jsonb;
BEGIN
  SELECT id, order_number, customer_name, customer_email, customer_phone,
         shipping_address, shipping_city, shipping_postal_code, shipping_country,
         subtotal, shipping_cost, total, payment_method, status, created_at
  INTO v_order
  FROM public.orders
  WHERE order_number = p_order_number;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'product_name', oi.product_name,
    'product_price', oi.product_price,
    'quantity', oi.quantity,
    'line_total', oi.line_total
  ) ORDER BY oi.created_at), '[]'::jsonb)
  INTO v_items
  FROM public.order_items oi
  WHERE oi.order_id = v_order.id;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'customer_name', v_order.customer_name,
    'customer_email', v_order.customer_email,
    'customer_phone', v_order.customer_phone,
    'shipping_address', v_order.shipping_address,
    'shipping_city', v_order.shipping_city,
    'shipping_postal_code', v_order.shipping_postal_code,
    'shipping_country', v_order.shipping_country,
    'subtotal', v_order.subtotal,
    'shipping_cost', v_order.shipping_cost,
    'total', v_order.total,
    'payment_method', v_order.payment_method,
    'status', v_order.status,
    'created_at', v_order.created_at,
    'items', v_items
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_order_by_number(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_order_by_number(text) TO anon, authenticated;

-- ============================
-- Update order status (admin-only, handles margin)
-- ============================
CREATE OR REPLACE FUNCTION public.update_order_status(p_order_id uuid, p_status text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_current_status text;
  v_is_admin boolean;
BEGIN
  -- Check admin
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validate status
  IF p_status NOT IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  -- Get current status
  SELECT status INTO v_current_status FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  -- If status hasn't changed, do nothing
  IF v_current_status = p_status THEN
    RETURN jsonb_build_object('success', true, 'message', 'No change');
  END IF;

  -- Update order status
  UPDATE public.orders SET status = p_status WHERE id = p_order_id;

  -- Handle margin tracking
  IF p_status = 'cancelled' THEN
    -- Remove margin from total (set included_in_total = false)
    UPDATE public.order_margin_tracking
    SET included_in_total = false
    WHERE order_id = p_order_id AND included_in_total = true;
  ELSE
    -- If moving FROM cancelled TO non-cancelled, re-include margin
    IF v_current_status = 'cancelled' THEN
      UPDATE public.order_margin_tracking
      SET included_in_total = true
      WHERE order_id = p_order_id AND included_in_total = false;
    END IF;
    -- If both old and new are non-cancelled, no margin change needed
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Status updated');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_order_status(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text) TO authenticated;

-- ============================
-- Get dashboard stats (admin-only)
-- ============================
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_total_products integer;
  v_total_orders integer;
  v_pending_orders integer;
  v_completed_orders integer;
  v_cancelled_orders integer;
  v_total_sales numeric;
  v_total_margin numeric;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT count(*) INTO v_total_products FROM public.products;

  SELECT count(*) INTO v_total_orders FROM public.orders;
  SELECT count(*) INTO v_pending_orders FROM public.orders WHERE status = 'pending';
  SELECT count(*) INTO v_completed_orders FROM public.orders WHERE status = 'delivered';
  SELECT count(*) INTO v_cancelled_orders FROM public.orders WHERE status = 'cancelled';

  SELECT COALESCE(sum(total), 0) INTO v_total_sales
  FROM public.orders
  WHERE status != 'cancelled';

  SELECT COALESCE(sum(total_margin), 0) INTO v_total_margin
  FROM public.order_margin_tracking
  WHERE included_in_total = true;

  RETURN jsonb_build_object(
    'total_products', v_total_products,
    'total_orders', v_total_orders,
    'pending_orders', v_pending_orders,
    'completed_orders', v_completed_orders,
    'cancelled_orders', v_cancelled_orders,
    'total_sales', v_total_sales,
    'total_margin', v_total_margin
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;

-- ============================
-- Get HHC status for order items (admin-only)
-- ============================
CREATE OR REPLACE FUNCTION public.get_order_hhc_statuses(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_result jsonb;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'order_item_id', oi.id,
    'product_id', oi.product_id,
    'product_name', oi.product_name,
    'hhc_status', CASE
      WHEN h.id IS NOT NULL THEN h.status
      ELSE NULL
    END
  )), '[]'::jsonb)
  INTO v_result
  FROM public.order_items oi
  LEFT JOIN public.hhc_products h ON h.product_id = oi.product_id
  WHERE oi.order_id = p_order_id;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_order_hhc_statuses(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_order_hhc_statuses(uuid) TO authenticated;
