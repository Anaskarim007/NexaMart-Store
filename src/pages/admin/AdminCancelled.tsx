import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDateTime } from '@/lib/utils';
import type { Order, OrderItem } from '@/types';
import { Search, X, Eye, ArrowLeft, Loader2 } from 'lucide-react';

export default function AdminCancelled() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [moving, setMoving] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('orders')
      .select('*')
      .eq('status', 'cancelled')
      .order('created_at', { ascending: false });
    if (search) {
      query = query.or(`customer_email.ilike.%${search}%,hhc_id.ilike.%${search}%`);
    }
    const { data } = await query;
    setOrders(data ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const moveToCompleted = async () => {
    if (selectedIds.size === 0) return;
    setMoving(true);
    for (const id of selectedIds) {
      await supabase.rpc('update_order_status', { p_order_id: id, p_status: 'completed' });
    }
    setSelectedIds(new Set());
    setMoving(false);
    fetchOrders();
  };

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at');
    setOrderItems(data ?? []);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink-900">Cancelled Orders</h1>
          <p className="text-sm text-ink-500 mt-1">Orders that have been cancelled</p>
        </div>
        {selectedIds.size > 0 && (
          <button onClick={moveToCompleted} disabled={moving} className="btn-primary inline-flex items-center gap-2 bg-green-700 hover:bg-green-800">
            {moving ? <Loader2 size={14} className="animate-spin" /> : <ArrowLeft size={14} />}
            Move to Completed ({selectedIds.size})
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center border border-ink-200 bg-white max-w-md">
          <Search size={16} className="ml-4 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or HHC ID..."
            className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-ink-400 text-sm py-20">Loading cancelled orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center text-ink-400 text-sm py-20">No cancelled orders found.</div>
      ) : (
        <div className="overflow-x-auto bg-white border border-ink-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-2xs uppercase tracking-widest text-ink-400">
                <th className="text-left p-4 w-8"></th>
                <th className="text-left p-4">Order #</th>
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">HHC ID</th>
                <th className="text-right p-4">Total</th>
                <th className="text-right p-4">HHC Price</th>
                <th className="text-right p-4">Margin</th>
                <th className="text-left p-4">Date</th>
                <th className="text-center p-4">View</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-ink-50 hover:bg-ivory-50/50 opacity-60">
                  <td className="p-4">
                    <input type="checkbox" checked={selectedIds.has(order.id)} onChange={() => toggleSelect(order.id)} className="accent-ink-900" />
                  </td>
                  <td className="p-4 font-medium text-ink-900">{order.order_number}</td>
                  <td className="p-4 text-ink-700">{order.customer_name}</td>
                  <td className="p-4 text-ink-600 text-xs">{order.customer_email}</td>
                  <td className="p-4 text-ink-600 text-xs">{order.hhc_id ?? '—'}</td>
                  <td className="p-4 text-right text-ink-900">{formatPrice(Number(order.total))}</td>
                  <td className="p-4 text-right text-ink-600">{order.hhc_price ? formatPrice(Number(order.hhc_price)) : '—'}</td>
                  <td className="p-4 text-right text-ink-600">{order.margin ? formatPrice(Number(order.margin)) : '—'}</td>
                  <td className="p-4 text-ink-500 text-xs">{formatDateTime(order.created_at)}</td>
                  <td className="p-4 text-center">
                    <button onClick={() => viewOrder(order)} className="p-1.5 text-ink-500 hover:text-ink-900 transition-colors inline-flex">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-ivory-50 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-ink-100 sticky top-0 bg-ivory-50 z-10">
              <div>
                <h2 className="font-serif text-xl text-ink-900">Order {selectedOrder.order_number}</h2>
                <p className="text-2xs text-ink-500 mt-1">Status: Cancelled | HHC ID: {selectedOrder.hhc_id ?? '—'}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-2xs uppercase tracking-widest text-ink-400 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-2xs text-ink-400">Name</p><p className="text-ink-900">{selectedOrder.customer_name}</p></div>
                  <div><p className="text-2xs text-ink-400">Email</p><p className="text-ink-900">{selectedOrder.customer_email}</p></div>
                  <div><p className="text-2xs text-ink-400">Phone</p><p className="text-ink-900">{selectedOrder.customer_phone}</p></div>
                  <div><p className="text-2xs text-ink-400">Address</p><p className="text-ink-900">{selectedOrder.shipping_address}, {selectedOrder.shipping_city}</p></div>
                </div>
              </div>
              <div>
                <h3 className="text-2xs uppercase tracking-widest text-ink-400 mb-3">HHC Information (Preserved)</h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-2xs text-ink-400">HHC ID</p><p className="text-ink-900">{selectedOrder.hhc_id ?? '—'}</p></div>
                  <div><p className="text-2xs text-ink-400">HHC Price</p><p className="text-ink-900">{selectedOrder.hhc_price ? formatPrice(Number(selectedOrder.hhc_price)) : '—'}</p></div>
                  <div><p className="text-2xs text-ink-400">Margin</p><p className="text-ink-900">{selectedOrder.margin ? formatPrice(Number(selectedOrder.margin)) : '—'}</p></div>
                </div>
              </div>
              <div>
                <h3 className="text-2xs uppercase tracking-widest text-ink-400 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between border-b border-ink-50 pb-3">
                      <div>
                        <p className="text-ink-900">{item.product_name}</p>
                        <p className="text-2xs text-ink-500">Qty: {item.quantity} × {formatPrice(Number(item.product_price))}</p>
                      </div>
                      <p className="text-ink-900">{formatPrice(Number(item.line_total))}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-ink-100 mt-4 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-ink-600"><span>Subtotal</span><span>{formatPrice(Number(selectedOrder.subtotal))}</span></div>
                  <div className="flex justify-between text-ink-900 font-medium border-t border-ink-100 pt-2"><span>Total</span><span>{formatPrice(Number(selectedOrder.total))}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
