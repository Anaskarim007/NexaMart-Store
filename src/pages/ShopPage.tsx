import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';
import ProductCard from '@/components/storefront/ProductCard';

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') ?? '');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sort, setSort] = useState<SortOption>('newest');

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('name');
      setCategories(data ?? []);
    }
    fetchCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('active', true);

    if (searchParams.get('filter') === 'featured') {
      query = query.eq('featured', true);
    } else if (searchParams.get('filter') === 'new') {
      query = query.eq('new_arrival', true);
    }

    if (selectedCategory) {
      query = query.eq('categories.slug', selectedCategory);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data } = await query.limit(48);
    let filtered = data ?? [];

    if (maxPrice) {
      const priceLimit = parseFloat(maxPrice);
      filtered = filtered.filter(
        (p) => (p.sale_price ?? p.price) <= priceLimit,
      );
    }

    setProducts(filtered);
    setLoading(false);
  }, [searchParams, selectedCategory, search, sort, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(search ? { q: search } : {});
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setMaxPrice('');
    setSort('newest');
    setSearchParams({});
  };

  const hasActiveFilters = search || selectedCategory || maxPrice || searchParams.get('filter');

  return (
    <div className="container-luxury py-12 animate-fade-in">
      <div className="text-center mb-12">
        <p className="eyebrow mb-3">Collection</p>
        <h1 className="heading-display text-4xl md:text-5xl text-ink-900">Shop All Products</h1>
      </div>

      {/* Filters bar */}
      <div className="mb-10 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
          <form onSubmit={handleSearch} className="flex-1 flex items-center border border-ink-200 bg-white">
            <Search size={16} className="ml-4 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="px-3 text-ink-400 hover:text-ink-900">
                <X size={14} />
              </button>
            )}
          </form>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 text-sm border border-ink-200 bg-white focus:outline-none focus:border-ink-900"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>

          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max Price"
            className="w-full md:w-32 px-4 py-2.5 text-sm border border-ink-200 bg-white focus:outline-none focus:border-ink-900"
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-4 py-2.5 text-sm border border-ink-200 bg-white focus:outline-none focus:border-ink-900"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A-Z</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-2xs uppercase tracking-widest text-ink-500 hover:text-ink-900 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="text-center text-ink-400 text-sm py-20">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-ink-400 text-sm mb-4">No products found matching your criteria.</p>
          <button onClick={clearFilters} className="btn-secondary">Clear Filters</button>
        </div>
      ) : (
        <>
          <p className="text-2xs uppercase tracking-widest text-ink-400 mb-6">
            {products.length} {products.length === 1 ? 'Product' : 'Products'}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
