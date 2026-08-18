import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { CartItem } from '@/types';

export default function CartPage() {
  const navigate = useNavigate();
  const cart: CartItem[] = JSON.parse(localStorage.getItem('nexamart-cart') ?? '[]');

  const updateQuantity = (productId: string, quantity: number) => {
    const updated = cart.map((i) =>
      i.product_id === productId
        ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stock_quantity)) }
        : i,
    );
    localStorage.setItem('nexamart-cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
    navigate(0);
  };

  const removeItem = (productId: string) => {
    const updated = cart.filter((i) => i.product_id !== productId);
    localStorage.setItem('nexamart-cart', JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
    navigate(0);
  };

  const clearCart = () => {
    localStorage.setItem('nexamart-cart', '[]');
    window.dispatchEvent(new Event('cart-updated'));
    navigate(0);
  };

  const subtotal = cart.reduce((sum, i) => {
    const price = i.sale_price ?? i.price;
    return sum + price * i.quantity;
  }, 0);

  const total = subtotal;

  if (cart.length === 0) {
    return (
      <div className="container-luxury py-20 text-center animate-fade-in">
        <ShoppingBag size={48} className="text-ink-300 mx-auto mb-6" />
        <h1 className="font-serif text-3xl text-ink-900 mb-4">Your Cart is Empty</h1>
        <p className="text-sm text-ink-500 mb-8">Discover our curated collection of premium products.</p>
        <Link to="/shop" className="btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  return (
    <div className="container-luxury py-12 animate-fade-in">
      <div className="text-center mb-12">
        <p className="eyebrow mb-3">Shopping Bag</p>
        <h1 className="heading-display text-4xl text-ink-900">Your Cart</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item) => (
            <div key={item.product_id} className="flex gap-4 border-b border-ink-100 pb-6">
              <Link to={`/product/${item.slug}`} className="flex-shrink-0">
                <div className="w-24 h-32 overflow-hidden bg-ivory-100">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-300 text-xs">No image</div>
                  )}
                </div>
              </Link>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <Link to={`/product/${item.slug}`}>
                    <h3 className="font-serif text-lg text-ink-900 hover:text-champagne-600 transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-ink-500 mt-1">
                    {formatPrice(item.sale_price ?? item.price)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center border border-ink-200">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="p-2 hover:bg-ink-50 transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="px-4 text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="p-2 hover:bg-ink-50 transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.product_id)}
                    className="text-ink-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-ink-900">
                  {formatPrice((item.sale_price ?? item.price) * item.quantity)}
                </p>
              </div>
            </div>
          ))}

          <button
            onClick={clearCart}
            className="text-2xs uppercase tracking-widest text-ink-500 hover:text-red-600 transition-colors"
          >
            Clear Cart
          </button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-ink-100 p-6">
            <h2 className="font-serif text-xl text-ink-900 mb-6">Order Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Shipping</span>
                <span className="text-green-700">Free Delivery</span>
              </div>
              <div className="border-t border-ink-100 pt-3 flex justify-between text-ink-900 font-medium">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <Link to="/checkout" className="btn-primary w-full mt-6">
              Proceed to Checkout
              <ArrowRight size={14} />
            </Link>
            <Link to="/shop" className="btn-ghost w-full mt-3">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
