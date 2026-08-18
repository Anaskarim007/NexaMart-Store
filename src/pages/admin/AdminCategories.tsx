import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/utils';
import type { Category } from '@/types';
import { Plus, Edit, Trash2, X, Loader2, Upload } from 'lucide-react';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', image_url: '', active: true });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', image_url: '', active: true });
    setError(null);
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description ?? '', image_url: cat.image_url ?? '', active: cat.active });
    setError(null);
    setShowModal(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('category-images').upload(fileName, file);
    if (!upErr) {
      const { data } = supabase.storage.from('category-images').getPublicUrl(fileName);
      setForm({ ...form, image_url: data.publicUrl });
    }
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!form.name) {
      setError('Name is required.');
      setSaving(false);
      return;
    }

    try {
      const slug = slugify(form.name) + '-' + Date.now().toString().slice(-4);
      const payload = {
        name: form.name,
        slug: editing ? editing.slug : slug,
        description: form.description || null,
        image_url: form.image_url || null,
        active: form.active,
      };

      if (editing) {
        const { error: err } = await supabase.from('categories').update(payload).eq('id', editing.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('categories').insert(payload);
        if (err) throw err;
      }

      setShowModal(false);
      fetchCategories();
    } catch {
      setError('Could not save category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? Products in this category will be uncategorized.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) fetchCategories();
  };

  const toggleActive = async (cat: Category) => {
    await supabase.from('categories').update({ active: !cat.active }).eq('id', cat.id);
    fetchCategories();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-ink-900">Categories</h1>
          <p className="text-sm text-ink-500 mt-1">Manage product categories</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={14} /> Add Category</button>
      </div>

      {loading ? (
        <div className="text-center text-ink-400 text-sm py-20">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="text-center text-ink-400 text-sm py-20">No categories yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white border border-ink-100 p-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 overflow-hidden bg-ivory-100 flex-shrink-0">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-300 text-xs">{cat.name.slice(0, 3)}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif text-base text-ink-900">{cat.name}</h3>
                  <p className="text-2xs text-ink-500 mt-1 line-clamp-2">{cat.description ?? 'No description'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => toggleActive(cat)}
                      className={`text-2xs uppercase tracking-widest px-2 py-0.5 border ${
                        cat.active ? 'text-green-700 border-green-200' : 'text-ink-400 border-ink-200'
                      }`}
                    >
                      {cat.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-ink-50">
                <button onClick={() => openEdit(cat)} className="p-1.5 text-ink-500 hover:text-ink-900 transition-colors"><Edit size={14} /></button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-ink-500 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4">
          <div className="bg-ivory-50 w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-ink-100">
              <h2 className="font-serif text-xl text-ink-900">{editing ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <p className="text-2xs text-red-600 bg-red-50 border border-red-100 p-3">{error}</p>}
              <div>
                <label className="label">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input resize-none" />
              </div>
              <div>
                <label className="label">Image</label>
                <div className="flex items-center gap-4">
                  {form.image_url && <div className="w-16 h-16 overflow-hidden bg-ivory-100"><img src={form.image_url} alt="Category" className="w-full h-full object-cover" /></div>}
                  <label className="btn-secondary cursor-pointer">
                    <Upload size={14} /> Upload
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  </label>
                  {uploading && <Loader2 size={16} className="animate-spin text-ink-400" />}
                </div>
                <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="input mt-2" placeholder="Or paste URL" />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-ink-900" />
                Active
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save'}
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
