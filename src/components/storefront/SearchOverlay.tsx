import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/shop?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-ivory-50/98 backdrop-blur-md animate-fade-in">
      <div className="container-luxury pt-24">
        <div className="flex justify-end mb-8">
          <button onClick={onClose} className="p-2 hover:text-champagne-600 transition-colors">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className="flex items-center border-b-2 border-ink-900 pb-4">
            <Search size={24} className="text-ink-400 mr-4" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products..."
              autoFocus
              className="flex-1 bg-transparent text-2xl font-serif font-light text-ink-900 placeholder-ink-300 focus:outline-none"
            />
          </div>
          <p className="text-2xs uppercase tracking-widest text-ink-400 mt-4 text-center">
            Press enter to search
          </p>
        </form>
      </div>
    </div>
  );
}
