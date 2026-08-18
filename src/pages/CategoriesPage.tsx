import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('name');
      setCategories(data ?? []);
      setLoading(false);
    }
    fetchCategories();
  }, []);

  return (
    <div className="container-luxury py-12 animate-fade-in">
      <div className="text-center mb-12">
        <p className="eyebrow mb-3">Browse</p>
        <h1 className="heading-display text-4xl md:text-5xl text-ink-900">All Categories</h1>
      </div>

      {loading ? (
        <div className="text-center text-ink-400 text-sm py-20">Loading categories...</div>
      ) : categories.length === 0 ? (
        <div className="text-center text-ink-400 text-sm py-20">No categories yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="group block">
              <div className="aspect-[4/3] overflow-hidden bg-ivory-100 mb-4">
                {cat.image_url ? (
                  <img
                    src={cat.image_url}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-300">
                    <span className="font-serif text-2xl">{cat.name}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl text-ink-900 group-hover:text-champagne-600 transition-colors">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-sm text-ink-500 mt-1 line-clamp-2">{cat.description}</p>
                  )}
                </div>
                <ArrowRight size={18} className="text-ink-400 group-hover:text-ink-900 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
