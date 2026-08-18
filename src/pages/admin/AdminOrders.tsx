import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDateTime } from '@/lib/utils';
import type { Order, OrderItem } from '@/types';
import { X, Eye, FileText, Loader2 } from 'lucide-react';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [updating, setUpdating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hhcInput, setHhcInput] = useState<string>('');
  const [hhcOrderId, setHhcOrderId] = useState<string | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<OrderItem[]>([]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (filterStatus) {
      query = query.eq('status', filterStatus);
    }
    const { data } = await query;
    setOrders(data ?? []);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at');
    setOrderItems(data ?? []);
  };

  const assignHhc = async (orderId: string) => {
    if (!hhcInput.trim()) return;
    setUpdating(true);
    const { error } = await supabase.rpc('assign_hhc_id', {
      p_order_id: orderId,
      p_hhc_id: hhcInput.trim(),
    });
    if (!error) {
      setHhcInput('');
      setHhcOrderId(null);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: 'hhc', hhc_id: hhcInput.trim() });
      }
    }
    setUpdating(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generateInvoice = async () => {
    if (selectedIds.size !== 1) return;
    const orderId = [...selectedIds][0];
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at');
    setInvoiceItems(data ?? []);
    setInvoiceOrder(order);
    setSelectedIds(new Set());
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink-900">Orders</h1>
          <p className="text-sm text-ink-500 mt-1">Manage customer orders</p>
        </div>
        {selectedIds.size === 1 && (
          <button onClick={generateInvoice} className="btn-primary inline-flex items-center gap-2">
            <FileText size={14} /> Generate Invoice
          </button>
        )}
      </div>

      <div className="mb-6">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input max-w-xs">
          <option value="">All Orders</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="hhc">HHC</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-ink-400 text-sm py-20">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="text-center text-ink-400 text-sm py-20">No orders found.</div>
      ) : (
        <div className="overflow-x-auto bg-white border border-ink-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-2xs uppercase tracking-widest text-ink-400">
                <th className="text-left p-4 w-8"></th>
                <th className="text-left p-4">Order #</th>
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Date</th>
                <th className="text-right p-4">Total</th>
                <th className="text-center p-4">Status</th>
                <th className="text-center p-4">HHC ID</th>
                <th className="text-center p-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const isHhc = order.status === 'hhc' || (order.hhc_id && order.status !== 'cancelled');
                return (
                  <tr
                    key={order.id}
                    className={`border-b border-ink-50 hover:bg-ivory-50/50 ${
                      isHhc ? 'opacity-50 bg-ink-50/30' : ''
                    }`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="accent-ink-900"
                      />
                    </td>
                    <td className="p-4 font-medium text-ink-900">
                      {order.order_number}
                      {isHhc && (
                        <span className="ml-2 text-2xs uppercase tracking-widest text-ink-400 bg-ink-100 px-2 py-0.5">
                          Moved to HHC
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-ink-700">{order.customer_name}</td>
                    <td className="p-4 text-ink-500">{formatDateTime(order.created_at)}</td>
                    <td className="p-4 text-right text-ink-900">{formatPrice(Number(order.total))}</td>
                    <td className="p-4 text-center">
                      <span className="text-2xs uppercase tracking-widest border border-ink-200 px-2 py-1 text-ink-600">
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-center text-ink-600 text-xs">
                      {order.hhc_id ?? '—'}
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => viewOrder(order)} className="p-1.5 text-ink-500 hover:text-ink-900 transition-colors inline-flex">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
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
                <p className="text-2xs text-ink-500 mt-1">{formatDateTime(selectedOrder.created_at)}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer info */}
              <div>
                <h3 className="text-2xs uppercase tracking-widest text-ink-400 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-2xs text-ink-400">Name</p><p className="text-ink-900">{selectedOrder.customer_name}</p></div>
                  <div><p className="text-2xs text-ink-400">Email</p><p className="text-ink-900">{selectedOrder.customer_email}</p></div>
                  <div><p className="text-2xs text-ink-400">Phone</p><p className="text-ink-900">{selectedOrder.customer_phone}</p></div>
                  <div><p className="text-2xs text-ink-400">Payment</p><p className="text-ink-900">{selectedOrder.payment_method}</p></div>
                  <div className="col-span-2"><p className="text-2xs text-ink-400">Address</p><p className="text-ink-900">{selectedOrder.shipping_address}, {selectedOrder.shipping_city}, {selectedOrder.shipping_postal_code}, {selectedOrder.shipping_country}</p></div>
                </div>
              </div>

              {/* Items */}
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
                  <div className="flex justify-between text-ink-600"><span>Shipping</span><span>{Number(selectedOrder.shipping_cost) === 0 ? 'Free Delivery' : formatPrice(Number(selectedOrder.shipping_cost))}</span></div>
                  <div className="flex justify-between text-ink-900 font-medium border-t border-ink-100 pt-2"><span>Total</span><span>{formatPrice(Number(selectedOrder.total))}</span></div>
                </div>
              </div>

              {/* HHC ID assignment */}
              {selectedOrder.status === 'pending' && !selectedOrder.hhc_id && (
                <div>
                  <h3 className="text-2xs uppercase tracking-widest text-ink-400 mb-3">Assign HHC ID</h3>
                  <div className="flex gap-2">
                    <input
                      value={hhcOrderId === selectedOrder.id ? hhcInput : ''}
                      onChange={(e) => {
                        setHhcOrderId(selectedOrder.id);
                        setHhcInput(e.target.value);
                      }}
                      placeholder="Enter HHC ID..."
                      className="input flex-1"
                    />
                    <button
                      onClick={() => assignHhc(selectedOrder.id)}
                      disabled={updating || !hhcInput.trim()}
                      className="btn-primary inline-flex items-center gap-2"
                    >
                      {updating ? <Loader2 size={14} className="animate-spin" /> : null}
                      Assign & Move to HHC
                    </button>
                  </div>
                </div>
              )}

              {selectedOrder.hhc_id && (
                <div>
                  <h3 className="text-2xs uppercase tracking-widest text-ink-400 mb-3">HHC Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><p className="text-2xs text-ink-400">HHC ID</p><p className="text-ink-900">{selectedOrder.hhc_id}</p></div>
                    <div><p className="text-2xs text-ink-400">Status</p><p className="text-ink-900 uppercase">{selectedOrder.status}</p></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invoice modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-ink-100 sticky top-0 bg-white z-10 no-print">
              <h2 className="font-serif text-xl text-ink-900">Invoice</h2>
              <div className="flex gap-2">
                <button onClick={printInvoice} className="btn-primary text-xs">Print</button>
                <button onClick={() => setInvoiceOrder(null)} className="btn-secondary text-xs">Close</button>
              </div>
            </div>

            <div className="p-8 invoice-content">
              <div className="flex justify-between mb-8">
                <div>
                  <h1 className="font-serif text-3xl text-ink-900 tracking-widest">NEXAMART</h1>
                  <p className="text-2xs uppercase tracking-widest text-ink-400 mt-1">Premium Products</p>
                </div>
                <div className="text-right">
                  <p className="text-2xs uppercase tracking-widest text-ink-400">Invoice</p>
                  <p className="text-lg font-medium text-ink-900">{invoiceOrder.order_number}</p>
                  <p className="text-2xs text-ink-500 mt-1">{formatDateTime(invoiceOrder.created_at)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-2xs uppercase tracking-widest text-ink-400 mb-2">Bill To</p>
                  <p className="text-sm font-medium text-ink-900">{invoiceOrder.customer_name}</p>
                  <p className="text-xs text-ink-600">{invoiceOrder.customer_email}</p>
                  <p className="text-xs text-ink-600">{invoiceOrder.customer_phone}</p>
                </div>
                <div>
                  <p className="text-2xs uppercase tracking-widest text-ink-400 mb-2">Ship To</p>
                  <p className="text-xs text-ink-600">{invoiceOrder.shipping_address}</p>
                  <p className="text-xs text-ink-600">{invoiceOrder.shipping_city}, {invoiceOrder.shipping_postal_code}</p>
                  <p className="text-xs text-ink-600">{invoiceOrder.shipping_country}</p>
                </div>
              </div>

              <table className="w-full text-sm mb-8">
                <thead>
                  <tr className="border-b border-ink-200 text-2xs uppercase tracking-widest text-ink-400">
                    <th className="text-left py-3">Product</th>
                    <th className="text-right py-3">Price</th>
                    <th className="text-right py-3">Qty</th>
                    <th className="text-right py-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item) => (
                    <tr key={item.id} className="border-b border-ink-50">
                      <td className="py-3 text-ink-900">{item.product_name}</td>
                      <td className="py-3 text-right text-ink-600">{formatPrice(Number(item.product_price))}</td>
                      <td className="py-3 text-right text-ink-600">{item.quantity}</td>
                      <td className="py-3 text-right text-ink-900">{formatPrice(Number(item.line_total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ml-auto max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-ink-600"><span>Subtotal</span><span>{formatPrice(Number(invoiceOrder.subtotal))}</span></div>
                <div className="flex justify-between text-ink-600"><span>Shipping</span><span>{Number(invoiceOrder.shipping_cost) === 0 ? 'Free' : formatPrice(Number(invoiceOrder.shipping_cost))}</span></div>
                <div className="flex justify-between text-ink-900 font-medium border-t border-ink-200 pt-2"><span>Total</span><span>{formatPrice(Number(invoiceOrder.total))}</span></div>
              </div>

              <div className="mt-8 pt-6 border-t border-ink-100">
                <p className="text-2xs text-ink-400">Payment Method: {invoiceOrder.payment_method}</p>
                <p className="text-2xs text-ink-400 mt-1">Thank you for your purchase!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
