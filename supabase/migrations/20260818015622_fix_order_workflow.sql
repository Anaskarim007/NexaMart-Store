
-- ============================
-- 1. Fix generate_order_number to use extensions.gen_random_bytes
-- ============================
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  v_order_number text;
  v_exists boolean;
BEGIN
  LOOP
    v_order_number := 'NEX-' || upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 6));
    SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = v_order_number) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_order_number;
    END IF;
  END LOOP;
END;
$$;

-- ============================
-- 2. Add new order statuses: hhc, completed
-- ============================
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'hhc', 'completed'));

-- ============================
-- 3. Add HHC fields to orders table (order-level, not product-level)
-- ============================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS hhc_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS hhc_price numeric(12, 2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS margin numeric(12, 2) DEFAULT 0;

-- Add index for HHC ID search
CREATE INDEX IF NOT EXISTS idx_orders_hhc_id ON public.orders(hhc_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);

-- ============================
-- 4. Update place_order to use fixed generate_order_number
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
SECURITY DEFINER SET search_path = public, extensions
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
  v_items_result jsonb := '[]'::jsonb;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'No items in order';
  END IF;

  IF p_customer_name IS NULL OR p_customer_email IS NULL OR p_customer_phone IS NULL
     OR p_shipping_address IS NULL OR p_shipping_city IS NULL
     OR p_shipping_postal_code IS NULL OR p_shipping_country IS NULL THEN
    RAISE EXCEPTION 'Missing customer information';
  END IF;

  v_order_number := public.generate_order_number();

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

  FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
    SELECT id, name, price, sale_price, stock_quantity, slug
    INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::uuid
    FOR UPDATE;

    v_effective_price := COALESCE(v_product.sale_price, v_product.price);
    v_line_total := v_effective_price * (v_item->>'quantity')::integer;

    INSERT INTO public.order_items (order_id, product_id, product_name, product_price, quantity, line_total)
    VALUES (v_order_id, v_product.id, v_product.name, v_effective_price, (v_item->>'quantity')::integer, v_line_total)
    RETURNING id INTO v_order_item_id;

    UPDATE public.products
    SET stock_quantity = stock_quantity - (v_item->>'quantity')::integer
    WHERE id = v_product.id;

    v_items_result := v_items_result || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'product_price', v_effective_price,
      'quantity', (v_item->>'quantity')::integer,
      'line_total', v_line_total
    );
  END LOOP;

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

REVOKE EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, text, text, text, text) TO anon, authenticated;

-- ============================
-- 5. Update update_order_status to handle new statuses
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
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_status NOT IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'hhc', 'completed') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT status INTO v_current_status FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_current_status = p_status THEN
    RETURN jsonb_build_object('success', true, 'message', 'No change');
  END IF;

  UPDATE public.orders SET status = p_status WHERE id = p_order_id;

  -- Handle margin tracking for cancelled status
  IF p_status = 'cancelled' THEN
    UPDATE public.order_margin_tracking
    SET included_in_total = false
    WHERE order_id = p_order_id AND included_in_total = true;
  ELSE
    IF v_current_status = 'cancelled' THEN
      UPDATE public.order_margin_tracking
      SET included_in_total = true
      WHERE order_id = p_order_id AND included_in_total = false;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'Status updated');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_order_status(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_order_status(uuid, text) TO authenticated;

-- ============================
-- 6. Update get_dashboard_stats to use order-level margin
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
  v_hhc_orders integer;
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
  SELECT count(*) INTO v_completed_orders FROM public.orders WHERE status = 'completed';
  SELECT count(*) INTO v_cancelled_orders FROM public.orders WHERE status = 'cancelled';
  SELECT count(*) INTO v_hhc_orders FROM public.orders WHERE status = 'hhc';

  SELECT COALESCE(sum(total), 0) INTO v_total_sales
  FROM public.orders
  WHERE status NOT IN ('cancelled');

  -- Total margin from orders that are not cancelled
  -- Uses order-level margin (set during HHC processing)
  SELECT COALESCE(sum(margin), 0) INTO v_total_margin
  FROM public.orders
  WHERE status NOT IN ('cancelled') AND margin IS NOT NULL;

  RETURN jsonb_build_object(
    'total_products', v_total_products,
    'total_orders', v_total_orders,
    'pending_orders', v_pending_orders,
    'completed_orders', v_completed_orders,
    'cancelled_orders', v_cancelled_orders,
    'hhc_orders', v_hhc_orders,
    'total_sales', v_total_sales,
    'total_margin', v_total_margin
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_dashboard_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;

-- ============================
-- 7. New function: assign_hhc_id (admin-only)
-- Moves order to HHC status and sets HHC ID
-- ============================
CREATE OR REPLACE FUNCTION public.assign_hhc_id(p_order_id uuid, p_hhc_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_order record;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  UPDATE public.orders 
  SET hhc_id = p_hhc_id, status = 'hhc'
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'message', 'HHC ID assigned');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.assign_hhc_id(uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.assign_hhc_id(uuid, text) TO authenticated;

-- ============================
-- 8. New function: update_hhc_order (admin-only)
-- Updates HHC price and margin for an order
-- ============================
CREATE OR REPLACE FUNCTION public.update_hhc_order(
  p_order_id uuid,
  p_hhc_price numeric,
  p_margin numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.orders
  SET hhc_price = p_hhc_price, margin = p_margin
  WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'message', 'HHC order updated');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_hhc_order(uuid, numeric, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_hhc_order(uuid, numeric, numeric) TO authenticated;

-- ============================
-- 9. New function: complete_hhc_order (admin-only)
-- Moves order from HHC to completed
-- ============================
CREATE OR REPLACE FUNCTION public.complete_hhc_order(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_order record;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status != 'hhc' THEN
    RAISE EXCEPTION 'Order is not in HHC status';
  END IF;

  UPDATE public.orders SET status = 'completed' WHERE id = p_order_id;

  RETURN jsonb_build_object('success', true, 'message', 'Order completed');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_hhc_order(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_hhc_order(uuid) TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
