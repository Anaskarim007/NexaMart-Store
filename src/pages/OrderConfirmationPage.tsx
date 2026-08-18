import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDateTime } from '@/lib/utils';

interface OrderData {
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
  status: string;
  created_at: string;
  items: { product_name: string; product_price: number; quantity: number; line_total: number }[];
}

export default function OrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderNumber) return;
      const { data, error } = await supabase.rpc('get_order_by_number', {
        p_order_number: orderNumber,
      });
      if (!error && data) {
        setOrder(data as OrderData);
      }
      setLoading(false);
    }
    fetchOrder();
  }, [orderNumber]);

  if (loading) {
    return <div className="container-luxury py-20 text-center text-ink-400 text-sm">Loading order...</div>;
  }

  if (!order) {
    return (
      <div className="container-luxury py-20 text-center">
        <h1 className="font-serif text-3xl text-ink-900 mb-4">Order Not Found</h1>
        <p className="text-sm text-ink-500 mb-8">We couldn't find this order.</p>
        <Link to="/shop" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-luxury py-12 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 border border-green-200 bg-green-50 mb-6">
          <Check size={28} className="text-green-700" />
        </div>
        <p className="eyebrow mb-3">Thank You</p>
        <h1 className="heading-display text-4xl text-ink-900 mb-4">Order Confirmed</h1>
        <p className="text-sm text-ink-600">
          Your order has been placed successfully. We'll contact you shortly.
        </p>
        <p className="text-lg font-serif text-ink-900 mt-4">Order #{order.order_number}</p>
      </div>

      <div className="bg-white border border-ink-100 p-6 mb-6">
        <h2 className="text-2xs uppercase tracking-widest text-ink-500 mb-4">Order Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-ink-400 text-2xs uppercase tracking-widest mb-1">Date</p>
            <p className="text-ink-900">{formatDateTime(order.created_at)}</p>
          </div>
          <div>
            <p className="text-ink-400 text-2xs uppercase tracking-widest mb-1">Payment</p>
            <p className="text-ink-900">{order.payment_method}</p>
          </div>
          <div>
            <p className="text-ink-400 text-2xs uppercase tracking-widest mb-1">Name</p>
            <p className="text-ink-900">{order.customer_name}</p>
          </div>
          <div>
            <p className="text-ink-400 text-2xs uppercase tracking-widest mb-1">Phone</p>
            <p className="text-ink-900">{order.customer_phone}</p>
          </div>
          <div className="col-span-2">
            <p className="text-ink-400 text-2xs uppercase tracking-widest mb-1">Shipping Address</p>
            <p className="text-ink-900">{order.shipping_address}, {order.shipping_city}, {order.shipping_postal_code}, {order.shipping_country}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-ink-100 p-6 mb-6">
        <h2 className="text-2xs uppercase tracking-widest text-ink-500 mb-4">Items</h2>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm border-b border-ink-50 pb-3 last:border-0">
              <div>
                <p className="text-ink-900">{item.product_name}</p>
                <p className="text-2xs text-ink-500">Qty: {item.quantity} × {formatPrice(item.product_price)}</p>
              </div>
              <p className="text-ink-900">{formatPrice(item.line_total)}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-ink-100 mt-4 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-ink-600">
            <span>Subtotal</span>
            <span>{formatPrice(Number(order.subtotal))}</span>
          </div>
          <div className="flex justify-between text-ink-600">
            <span>Shipping</span>
            <span className="text-green-700">Free Delivery</span>
          </div>
          <div className="flex justify-between text-ink-900 font-medium border-t border-ink-100 pt-2">
            <span>Total</span>
            <span>{formatPrice(Number(order.total))}</span>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link to="/shop" className="btn-primary">
          Continue Shopping
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
