import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { Package, ShoppingCart, Clock, CheckCircle, XCircle, TrendingUp, BarChart3, ArrowRightLeft } from 'lucide-react';

interface Stats {
  total_products: number;
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  hhc_orders: number;
  total_sales: number;
  total_margin: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase.rpc('get_dashboard_stats');
      if (!error && data) {
        setStats(data as Stats);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Products', value: stats?.total_products ?? 0, icon: Package },
    { label: 'Total Orders', value: stats?.total_orders ?? 0, icon: ShoppingCart },
    { label: 'Pending Orders', value: stats?.pending_orders ?? 0, icon: Clock },
    { label: 'HHC Orders', value: stats?.hhc_orders ?? 0, icon: ArrowRightLeft },
    { label: 'Completed Orders', value: stats?.completed_orders ?? 0, icon: CheckCircle },
    { label: 'Cancelled Orders', value: stats?.cancelled_orders ?? 0, icon: XCircle },
    { label: 'Total Sales', value: formatPrice(Number(stats?.total_sales ?? 0)), icon: TrendingUp },
    { label: 'Total Margin', value: formatPrice(Number(stats?.total_margin ?? 0)), icon: BarChart3 },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-500 mt-1">Overview of your store performance</p>
      </div>

      {loading ? (
        <div className="text-center text-ink-400 text-sm py-20">Loading stats...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white border border-ink-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 border border-ink-200 flex items-center justify-center">
                    <Icon size={18} className="text-ink-700" />
                  </div>
                </div>
                <p className="text-2xs uppercase tracking-widest text-ink-400 mb-2">{card.label}</p>
                <p className="text-2xl font-serif font-light text-ink-900">{card.value}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
