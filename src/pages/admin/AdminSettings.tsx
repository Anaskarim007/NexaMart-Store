import { useAuth } from '@/hooks/useAuth';

export default function AdminSettings() {
  const { user, profile } = useAuth();

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink-900">Settings</h1>
        <p className="text-sm text-ink-500 mt-1">Account and store settings</p>
      </div>

      <div className="bg-white border border-ink-100 p-6 max-w-lg">
        <h2 className="font-serif text-xl text-ink-900 mb-6">Account Information</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-2xs uppercase tracking-widest text-ink-400 mb-1">Email</p>
            <p className="text-ink-900">{user?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-2xs uppercase tracking-widest text-ink-400 mb-1">Role</p>
            <p className="text-ink-900 capitalize">{profile?.role ?? '—'}</p>
          </div>
          <div>
            <p className="text-2xs uppercase tracking-widest text-ink-400 mb-1">Account ID</p>
            <p className="text-ink-900 text-xs font-mono">{user?.id ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-ink-100 p-6 max-w-lg mt-6">
        <h2 className="font-serif text-xl text-ink-900 mb-6">Store Information</h2>
        <div className="space-y-4 text-sm">
          <div>
            <p className="text-2xs uppercase tracking-widest text-ink-400 mb-1">Store Name</p>
            <p className="text-ink-900">NexaMart</p>
          </div>
          <div>
            <p className="text-2xs uppercase tracking-widest text-ink-400 mb-1">Notification Email</p>
            <p className="text-ink-900">nexamart10@gmail.com</p>
          </div>
          <div>
            <p className="text-2xs uppercase tracking-widest text-ink-400 mb-1">Payment Method</p>
            <p className="text-ink-900">Cash on Delivery</p>
          </div>
          <div>
            <p className="text-2xs uppercase tracking-widest text-ink-400 mb-1">Shipping</p>
            <p className="text-ink-900">Free Delivery on all orders</p>
          </div>
        </div>
      </div>
    </div>
  );
}
