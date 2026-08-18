import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDateTime } from '@/lib/utils';
import type { Order, OrderItem } from '@/types';
import { X, Loader2, CheckCircle, Save } from 'lucide-react';

export default function AdminHhc() {
  const [hhcOrders, setHhcOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    hhc_price: '',
    margin: '',
  });

  const fetchHhcOrders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'hhc')
      .order('created_at', { ascending: false });
    setHhcOrders(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHhcOrders();
  }, [fetchHhcOrders]);

  const openOrder = async (order: Order) => {
    setSelectedOrder(order);
    setError(null);
    setSuccess(null);
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at');
    setOrderItems(data ?? []);
    setForm({
      hhc_price: order.hhc_price ? String(order.hhc_price) : '',
      margin: order.margin ? String(order.margin) : '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const hhcPrice = parseFloat(form.hhc_price) || 0;
    const margin = parseFloat(form.margin) || 0;

    const { error: err } = await supabase.rpc('update_hhc_order', {
      p_order_id: selectedOrder.id,
      p_hhc_price: hhcPrice,
      p_margin: margin,
    });

    if (err) {
      setError(err.message);
    } else {
      setSuccess('HHC data saved successfully.');
      setSelectedOrder({ ...selectedOrder, hhc_price: hhcPrice, margin });
      fetchHhcOrders();
      setTimeout(() => setSuccess(null), 3000);
    }
    setSaving(false);
  };

  const handleComplete = async () => {
    if (!selectedOrder) return;
    setCompleting(true);
    setError(null);

    const { error: err } = await supabase.rpc('complete_hhc_order', {
      p_order_id: selectedOrder.id,
    });

    if (err) {
      setError(err.message);
    } else {
      setSelectedOrder(null);
      fetchHhcOrders();
    }
    setCompleting(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink-900">HHC Orders</h1>
        <p className="text-sm text-ink-500 mt-1">Orders transferred to HHC — enter HHC price and margin</p>
      </div>

      {loading ? (
        <div className="text-center text-ink-400 text-sm py-20">Loading HHC orders...</div>
      ) : hhcOrders.length === 0 ? (
        <div className="text-center text-ink-400 text-sm py-20">No HHC orders. Assign an HHC ID from the Orders section to transfer orders here.</div>
      ) : (
        <div className="overflow-x-auto bg-white border border-ink-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-2xs uppercase tracking-widest text-ink-400">
                <th className="text-left p-4">Order #</th>
                <th className="text-left p-4">HHC ID</th>
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Date</th>
                <th className="text-right p-4">Total</th>
                <th className="text-right p-4">HHC Price</th>
                <th className="text-right p-4">Margin</th>
                <th className="text-center p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {hhcOrders.map((order) => (
                <tr key={order.id} className="border-b border-ink-50 hover:bg-ivory-50/50 cursor-pointer" onClick={() => openOrder(order)}>
                  <td className="p-4 font-medium text-ink-900">{order.order_number}</td>
                  <td className="p-4 text-ink-700">{order.hhc_id ?? '—'}</td>
                  <td className="p-4 text-ink-700">{order.customer_name}</td>
                  <td className="p-4 text-ink-500">{formatDateTime(order.created_at)}</td>
                  <td className="p-4 text-right text-ink-900">{formatPrice(Number(order.total))}</td>
                  <td className="p-4 text-right text-ink-600">{order.hhc_price ? formatPrice(Number(order.hhc_price)) : '—'}</td>
                  <td className="p-4 text-right text-ink-600">{order.margin ? formatPrice(Number(order.margin)) : '—'}</td>
                  <td className="p-4 text-center">
                    <span className="text-2xs uppercase tracking-widest text-champagne-600">Manage</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* HHC detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-ivory-50 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-ink-100 sticky top-0 bg-ivory-50 z-10">
              <div>
                <h2 className="font-serif text-xl text-ink-900">HHC Order {selectedOrder.order_number}</h2>
                <p className="text-2xs text-ink-500 mt-1">HHC ID: {selectedOrder.hhc_id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {error && <p className="text-2xs text-red-600 bg-red-50 border border-red-100 p-3">{error}</p>}
              {success && <p className="text-2xs text-green-700 bg-green-50 border border-green-100 p-3">{success}</p>}

              {/* Customer info */}
              <div>
                <h3 className="text-2xs uppercase tracking-widest text-ink-400 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-2xs text-ink-400">Name</p><p className="text-ink-900">{selectedOrder.customer_name}</p></div>
                  <div><p className="text-2xs text-ink-400">Email</p><p className="text-ink-900">{selectedOrder.customer_email}</p></div>
                  <div><p className="text-2xs text-ink-400">Phone</p><p className="text-ink-900">{selectedOrder.customer_phone}</p></div>
                  <div><p className="text-2xs text-ink-400">Address</p><p className="text-ink-900">{selectedOrder.shipping_address}, {selectedOrder.shipping_city}</p></div>
                </div>
              </div>

              {/* Order items with selling price from product listing */}
              <div>
                <h3 className="text-2xs uppercase tracking-widest text-ink-400 mb-3">Order Items (Selling Price from Product Listing)</h3>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between border-b border-ink-50 pb-3">
                      <div>
                        <p className="text-ink-900">{item.product_name}</p>
                        <p className="text-2xs text-ink-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xs text-ink-400">Selling Price</p>
                        <p className="text-ink-900">{formatPrice(Number(item.product_price))}</p>
                        <p className="text-2xs text-ink-500 mt-1">Line Total: {formatPrice(Number(item.line_total))}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-ink-100 mt-4 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-ink-600"><span>Subtotal</span><span>{formatPrice(Number(selectedOrder.subtotal))}</span></div>
                  <div className="flex justify-between text-ink-900 font-medium border-t border-ink-100 pt-2"><span>Order Total</span><span>{formatPrice(Number(selectedOrder.total))}</span></div>
                </div>
              </div>

              {/* HHC price + margin form */}
              <form onSubmit={handleSave} className="space-y-4">
                <h3 className="text-2xs uppercase tracking-widest text-ink-400">HHC Price & Margin</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">HHC Price (Rs.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.hhc_price}
                      onChange={(e) => setForm({ ...form, hhc_price: e.target.value })}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="label">Margin (Rs.) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={form.margin}
                      onChange={(e) => setForm({ ...form, margin: e.target.value })}
                      className="input"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save HHC Data
                </button>
              </form>

              {/* Complete button */}
              <div className="border-t border-ink-100 pt-4">
                <button
                  onClick={handleComplete}
                  disabled={completing || !selectedOrder.hhc_price || !selectedOrder.margin}
                  className="btn-primary inline-flex items-center gap-2 bg-green-700 hover:bg-green-800"
                >
                  {completing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Complete Order
                </button>
                {(!selectedOrder.hhc_price || !selectedOrder.margin) && (
                  <p className="text-2xs text-ink-400 mt-2">Save HHC price and margin before completing.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
