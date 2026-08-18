import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice, slugify } from '@/lib/utils';
import type { Product, Category } from '@/types';
import { Plus, Search, Edit, Trash2, X, Loader2, Upload } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    short_description: '',
    category_id: '',
    price: '',
    sale_price: '',
    stock_quantity: '',
    sku: '',
    main_image_url: '',
    featured: false,
    new_arrival: false,
    active: true,
  });
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('products').select('*, category:categories(*)').order('created_at', { ascending: false });
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    const { data } = await query;
    setProducts(data ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '', description: '', short_description: '', category_id: '',
      price: '', sale_price: '', stock_quantity: '', sku: '', main_image_url: '',
      featured: false, new_arrival: false, active: true,
    });
    setGalleryImages([]);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? '',
      short_description: product.short_description ?? '',
      category_id: product.category_id ?? '',
      price: String(product.price),
      sale_price: product.sale_price ? String(product.sale_price) : '',
      stock_quantity: String(product.stock_quantity),
      sku: product.sku ?? '',
      main_image_url: product.main_image_url ?? '',
      featured: product.featured,
      new_arrival: product.new_arrival,
      active: product.active,
    });
    setGalleryImages([]);
    setError(null);
    setShowModal(true);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('product-images').upload(fileName, file);
    if (upErr) return null;
    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    if (url) setForm({ ...form, main_image_url: url });
    setUploading(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }
    setGalleryImages([...galleryImages, ...urls]);
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!form.name || !form.price || !form.stock_quantity) {
      setError('Name, price, and stock quantity are required.');
      setSaving(false);
      return;
    }

    try {
      const slug = slugify(form.name) + '-' + Date.now().toString().slice(-4);
      const payload = {
        name: form.name,
        slug: editing ? editing.slug : slug,
        description: form.description || null,
        short_description: form.short_description || null,
        category_id: form.category_id || null,
        price: parseFloat(form.price),
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        stock_quantity: parseInt(form.stock_quantity),
        sku: form.sku || null,
        main_image_url: form.main_image_url || null,
        featured: form.featured,
        new_arrival: form.new_arrival,
        active: form.active,
      };

      let productId = editing?.id;

      if (editing) {
        const { error: updateErr } = await supabase.from('products').update(payload).eq('id', editing.id);
        if (updateErr) throw updateErr;
      } else {
        const { data, error: insertErr } = await supabase.from('products').insert(payload).select().single();
        if (insertErr) throw insertErr;
        productId = data.id;
      }

      // Save gallery images
      if (galleryImages.length > 0 && productId) {
        const imgInserts = galleryImages.map((url, idx) => ({
          product_id: productId,
          image_url: url,
          sort_order: idx,
        }));
        const { error: imgErr } = await supabase.from('product_images').insert(imgInserts);
        if (imgErr) console.error('Gallery image error:', imgErr);
      }

      setShowModal(false);
      fetchProducts();
    } catch {
      setError('Could not save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) fetchProducts();
  };

  const toggleActive = async (product: Product) => {
    await supabase.from('products').update({ active: !product.active }).eq('id', product.id);
    fetchProducts();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-ink-900">Products</h1>
          <p className="text-sm text-ink-500 mt-1">Manage your product catalog</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={14} /> Add Product
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center border border-ink-200 bg-white max-w-md">
          <Search size={16} className="ml-4 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-ink-400 text-sm py-20">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center text-ink-400 text-sm py-20">No products found.</div>
      ) : (
        <div className="overflow-x-auto bg-white border border-ink-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-2xs uppercase tracking-widest text-ink-400">
                <th className="text-left p-4">Image</th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Category</th>
                <th className="text-right p-4">Price</th>
                <th className="text-right p-4">Stock</th>
                <th className="text-center p-4">Status</th>
                <th className="text-center p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-ink-50 hover:bg-ivory-50/50">
                  <td className="p-4">
                    <div className="w-12 h-16 overflow-hidden bg-ivory-100">
                      {product.main_image_url && <img src={product.main_image_url} alt={product.name} className="w-full h-full object-cover" />}
                    </div>
                  </td>
                  <td className="p-4 text-ink-900">{product.name}</td>
                  <td className="p-4 text-ink-500">{product.category?.name ?? '—'}</td>
                  <td className="p-4 text-right text-ink-900">{formatPrice(product.sale_price ?? product.price)}</td>
                  <td className="p-4 text-right text-ink-900">{product.stock_quantity}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => toggleActive(product)}
                      className={`text-2xs uppercase tracking-widest px-2 py-1 border ${
                        product.active
                          ? 'text-green-700 border-green-200'
                          : 'text-ink-400 border-ink-200'
                      }`}
                    >
                      {product.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(product)} className="p-1.5 text-ink-500 hover:text-ink-900 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 text-ink-500 hover:text-red-600 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-ivory-50 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-ink-100 sticky top-0 bg-ivory-50 z-10">
              <h2 className="font-serif text-xl text-ink-900">{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:text-ink-900">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <p className="text-2xs text-red-600 bg-red-50 border border-red-100 p-3">{error}</p>}

              <div>
                <label className="label">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input">
                    <option value="">None</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">SKU</label>
                  <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input" />
                </div>
              </div>

              <div>
                <label className="label">Short Description</label>
                <input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} className="input" />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="input resize-none" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="label">Price (Rs.) *</label>
                  <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label">Sale Price (Rs.)</label>
                  <input type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Stock *</label>
                  <input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} className="input" required />
                </div>
              </div>

              {/* Main image */}
              <div>
                <label className="label">Main Image</label>
                <div className="flex items-center gap-4">
                  {form.main_image_url && (
                    <div className="w-20 h-24 overflow-hidden bg-ivory-100">
                      <img src={form.main_image_url} alt="Main" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <label className="btn-secondary cursor-pointer">
                    <Upload size={14} /> Upload
                    <input type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
                  </label>
                  {uploading && <Loader2 size={16} className="animate-spin text-ink-400" />}
                </div>
                <input
                  value={form.main_image_url}
                  onChange={(e) => setForm({ ...form, main_image_url: e.target.value })}
                  className="input mt-2"
                  placeholder="Or paste image URL"
                />
              </div>

              {/* Gallery images */}
              <div>
                <label className="label">Additional Images</label>
                <div className="flex flex-wrap gap-3 mb-2">
                  {galleryImages.map((url, idx) => (
                    <div key={idx} className="w-16 h-20 overflow-hidden bg-ivory-100 relative">
                      <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setGalleryImages(galleryImages.filter((_, i) => i !== idx))}
                        className="absolute top-0 right-0 bg-ink-900/70 text-ivory-50 p-0.5"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="btn-secondary cursor-pointer">
                  <Upload size={14} /> Upload Images
                  <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                </label>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-ink-900" />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input type="checkbox" checked={form.new_arrival} onChange={(e) => setForm({ ...form, new_arrival: e.target.checked })} className="accent-ink-900" />
                  New Arrival
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-ink-900" />
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save Product'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
