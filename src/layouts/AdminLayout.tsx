import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Mail,
  BarChart3,
  Image,
  Settings,
  LogOut,
  Menu,
  X,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/categories', label: 'Categories', icon: FolderTree },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/admin/hhc', label: 'HHC', icon: BarChart3 },
  { path: '/admin/completed', label: 'Completed', icon: CheckCircle },
  { path: '/admin/cancelled', label: 'Cancelled', icon: XCircle },
  { path: '/admin/messages', label: 'Messages', icon: Mail },
  { path: '/admin/content', label: 'Content / Media', icon: Image },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-ivory-50 flex">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-ink-900 text-ivory-50 h-14 flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <span className="font-serif text-lg tracking-widest">NEXAMART</span>
        <Link to="/" className="text-2xs uppercase tracking-widest text-ivory-200/60">
          View Store
        </Link>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-ink-900 text-ivory-100 z-50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
      >
        <div className="p-6 border-b border-ivory-200/10">
          <Link to="/admin" className="block">
            <h2 className="font-serif text-2xl font-light tracking-widest text-ivory-50">NEXAMART</h2>
            <p className="text-2xs uppercase tracking-widest text-champagne-300 mt-1">Admin Panel</p>
          </Link>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive(item.path)
                    ? 'bg-ivory-200/10 text-ivory-50 border-l-2 border-champagne-400'
                    : 'text-ivory-200/60 hover:text-ivory-50 hover:bg-ivory-200/5'
                }`}
              >
                <Icon size={16} />
                <span className="font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-ivory-200/10 space-y-2">
          <Link
            to="/"
            className="block text-2xs uppercase tracking-widest text-ivory-200/60 hover:text-ivory-50 transition-colors"
          >
            View Store
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-2xs uppercase tracking-widest text-ivory-200/60 hover:text-ivory-50 transition-colors"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-ink-900/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-0 pt-14 lg:pt-0 min-w-0">
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
