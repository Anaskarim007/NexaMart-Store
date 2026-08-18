import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import type { CartItem } from '@/types';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const cart: CartItem[] = JSON.parse(localStorage.getItem('nexamart-cart') ?? '[]');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    shipping_city: '',
    shipping_postal_code: '',
    shipping_country: 'Pakistan',
  });

  const subtotal = cart.reduce((sum, i) => {
    const price = i.sale_price ?? i.price;
    return sum + price * i.quantity;
  }, 0);
  const total = subtotal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setLoading(true);

    try {
      const items = cart.map((i) => ({
        product_id: i.product_id,
        quantity: i.quantity,
      }));

      const { data, error: rpcError } = await supabase.rpc('place_order', {
        p_items: items,
        p_customer_name: form.customer_name,
        p_customer_email: form.customer_email,
        p_customer_phone: form.customer_phone,
        p_shipping_address: form.shipping_address,
        p_shipping_city: form.shipping_city,
        p_shipping_postal_code: form.shipping_postal_code,
        p_shipping_country: form.shipping_country,
      });

      if (rpcError) throw rpcError;
      if (!data) throw new Error('Failed to place order');

      // Trigger email notification (fire and forget — don't block order)
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-order-email`;
        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ orderNumber: data.order_number }),
        });
      } catch {
        // Email failure should not cancel the order
        console.error('Email notification failed');
      }

      // Clear cart
      localStorage.setItem('nexamart-cart', '[]');
      window.dispatchEvent(new Event('cart-updated'));

      navigate(`/order-confirmation/${data.order_number}`);
    } catch (err) {
      console.error('Order placement failed:', err);
      const message =
        err instanceof Error ? err.message : 'Could not place your order. Please try again.';
      setError(message);
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container-luxury py-20 text-center">
        <h1 className="font-serif text-3xl text-ink-900 mb-4">Your Cart is Empty</h1>
        <Link to="/shop" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-luxury py-12 animate-fade-in">
      <Link to="/cart" className="inline-flex items-center gap-2 text-2xs uppercase tracking-widest text-ink-500 hover:text-ink-900 transition-colors mb-8">
        <ArrowLeft size={14} /> Back to Cart
      </Link>

      <div className="text-center mb-12">
        <p className="eyebrow mb-3">Almost There</p>
        <h1 className="heading-display text-4xl text-ink-900">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Customer info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-ink-100 p-6">
            <h2 className="font-serif text-xl text-ink-900 mb-6">Shipping Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Full Name *</label>
                <input name="customer_name" required value={form.customer_name} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input name="customer_email" type="email" required value={form.customer_email} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input name="customer_phone" required value={form.customer_phone} onChange={handleChange} className="input" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address *</label>
                <input name="shipping_address" required value={form.shipping_address} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">City *</label>
                <input name="shipping_city" required value={form.shipping_city} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">Postal Code *</label>
                <input name="shipping_postal_code" required value={form.shipping_postal_code} onChange={handleChange} className="input" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Country *</label>
                <select name="shipping_country" required value={form.shipping_country} onChange={handleChange} className="input">
                  <option>Pakistan</option>
                  <option>India</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Canada</option>
                  <option>Australia</option>
                  <option>Germany</option>
                  <option>France</option>
                  <option>United Arab Emirates</option>
                  <option>Saudi Arabia</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-ink-100 p-6">
            <h2 className="font-serif text-xl text-ink-900 mb-4">Payment Method</h2>
            <div className="flex items-center gap-3 border border-ink-200 p-4">
              <input type="radio" checked readOnly className="accent-ink-900" />
              <div>
                <p className="text-sm font-medium text-ink-900">Cash on Delivery</p>
                <p className="text-2xs text-ink-500">Pay when your order arrives</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-ink-100 p-6 sticky top-24">
            <h2 className="font-serif text-xl text-ink-900 mb-6">Order Summary</h2>
            <div className="space-y-3 mb-6">
              {cart.map((item) => (
                <div key={item.product_id} className="flex gap-3 text-sm">
                  <div className="w-12 h-16 overflow-hidden bg-ivory-100 flex-shrink-0">
                    {item.image_url && <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-ink-900">{item.name}</p>
                    <p className="text-2xs text-ink-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-ink-900">{formatPrice((item.sale_price ?? item.price) * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t border-ink-100 pt-4">
              <div className="flex justify-between text-ink-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Shipping</span>
                <span className="text-green-700">Free Delivery</span>
              </div>
              <div className="flex justify-between text-ink-900 font-medium border-t border-ink-100 pt-2">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Placing Order...</> : 'Place Order'}
            </button>
            {error && <p className="text-2xs text-red-600 mt-4 text-center">{error}</p>}
          </div>
        </div>
      </form>
    </div>
  );
}
