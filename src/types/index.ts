export type UserRole = 'admin' | 'customer';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  category_id: string | null;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  sku: string | null;
  main_image_url: string | null;
  featured: boolean;
  new_arrival: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  product_images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface CartItem {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  sale_price: number | null;
  image_url: string | null;
  stock_quantity: number;
  quantity: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'hhc'
  | 'completed';

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_method: string;
  status: OrderStatus;
  hhc_id: string | null;
  hhc_price: number | null;
  margin: number | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

export interface HhcProduct {
  id: string;
  product_id: string;
  hhc_product_id: string | null;
  product_selling_price: number;
  hhc_price: number;
  my_margin: number;
  manual_margin: boolean;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  product?: Product | null;
}

export interface OrderMarginTracking {
  id: string;
  order_id: string;
  product_id: string;
  order_item_id: string | null;
  quantity: number;
  margin_per_item: number;
  total_margin: number;
  included_in_total: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

export interface EmailNotification {
  id: string;
  order_id: string;
  email_sent: boolean;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface SiteContent {
  id: string;
  key: string;
  image_url: string | null;
  updated_at: string;
}
