import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, Upload } from 'lucide-react';

const CONTENT_KEYS = [
  { key: 'hero_image', label: 'Homepage Hero Image' },
  { key: 'promo_banner', label: 'Promotional Banner' },
  { key: 'about_image', label: 'About Us Image' },
  { key: 'contact_image', label: 'Contact Us Image' },
];

export default function AdminContent() {
  const [content, setContent] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchContent() {
      const { data } = await supabase.from('site_content').select('*');
      const map: Record<string, string | null> = {};
      (data ?? []).forEach((item: { key: string; image_url: string | null }) => {
        map[item.key] = item.image_url;
      });
      setContent(map);
      setLoading(false);
    }
    fetchContent();
  }, []);

  const handleUpload = async (key: string, file: File) => {
    setUploading(key);
    setError(null);
    const ext = file.name.split('.').pop();
    const fileName = `${key}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('site-content').upload(fileName, file);
    if (upErr) {
      setError('Upload failed. Please try again.');
      setUploading(null);
      return;
    }
    const { data } = supabase.storage.from('site-content').getPublicUrl(fileName);

    const { error: updateErr } = await supabase
      .from('site_content')
      .update({ image_url: data.publicUrl })
      .eq('key', key);

    if (updateErr) {
      setError('Could not update content. Please try again.');
    } else {
      setContent({ ...content, [key]: data.publicUrl });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setUploading(null);
  };

  if (loading) {
    return <div className="text-center text-ink-400 text-sm py-20">Loading...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink-900">Content / Media</h1>
        <p className="text-sm text-ink-500 mt-1">Manage website images</p>
      </div>

      {error && <p className="text-2xs text-red-600 bg-red-50 border border-red-100 p-3 mb-4">{error}</p>}
      {success && <p className="text-2xs text-green-700 bg-green-50 border border-green-100 p-3 mb-4">Image updated successfully.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CONTENT_KEYS.map(({ key, label }) => (
          <div key={key} className="bg-white border border-ink-100 p-6">
            <h3 className="font-serif text-base text-ink-900 mb-4">{label}</h3>
            <div className="aspect-video overflow-hidden bg-ivory-100 mb-4">
              {content[key] ? (
                <img src={content[key]} alt={label} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-300 text-sm">No image set — using default</div>
              )}
            </div>
            <label className="btn-secondary cursor-pointer">
              <Upload size={14} /> Upload New Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(key, file);
                }}
                className="hidden"
              />
            </label>
            {uploading === key && <Loader2 size={16} className="animate-spin text-ink-400 ml-2 inline" />}
          </div>
        ))}
      </div>
    </div>
  );
}
