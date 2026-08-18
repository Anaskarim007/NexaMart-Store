import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Send, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ContactPage() {
  const [contactImage, setContactImage] = useState<string>(
    'https://images.pexels.com/photos/796602/pexels-photo-796602.jpeg?auto=compress&cs=tinysrgb&w=1200',
  );
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImage() {
      const { data } = await supabase
        .from('site_content')
        .select('image_url')
        .eq('key', 'contact_image')
        .maybeSingle();
      if (data?.image_url) setContactImage(data.image_url);
    }
    fetchImage();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.from('contact_messages').insert({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        message: form.message,
      });

      if (error) throw error;

      setSuccess(true);
      setForm({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setSuccess(false), 5000);
    } catch {
      setError('Could not send your message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
        <img src={contactImage} alt="Contact NexaMart" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-ivory-50/20" />
        <div className="relative z-10 h-full flex items-center justify-center text-center px-4">
          <div>
            <p className="eyebrow mb-3">Get in Touch</p>
            <h1 className="heading-display text-4xl md:text-5xl text-ink-900">Contact Us</h1>
          </div>
        </div>
      </section>

      <section className="container-luxury py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-5xl mx-auto">
          {/* Contact info */}
          <div>
            <h2 className="heading-display text-3xl text-ink-900 mb-6">We'd Love to Hear From You</h2>
            <p className="text-sm text-ink-600 leading-relaxed mb-8">
              Whether you have a question about a product, need help with an order, or simply want to
              share your thoughts — we're here to help.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 border border-ink-200 flex items-center justify-center">
                  <Mail size={16} className="text-ink-700" />
                </div>
                <div>
                  <p className="text-2xs uppercase tracking-widest text-ink-400 mb-1">Email</p>
                  <p className="text-sm text-ink-900">nexamart10@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 border border-ink-200 flex items-center justify-center">
                  <Phone size={16} className="text-ink-700" />
                </div>
                <div>
                  <p className="text-2xs uppercase tracking-widest text-ink-400 mb-1">Phone</p>
                  <p className="text-sm text-ink-900">+92 300 0000000</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 border border-ink-200 flex items-center justify-center">
                  <MapPin size={16} className="text-ink-700" />
                </div>
                <div>
                  <p className="text-2xs uppercase tracking-widest text-ink-400 mb-1">Address</p>
                  <p className="text-sm text-ink-900">Lahore, Pakistan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white border border-ink-100 p-8">
            {success ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-14 h-14 border border-green-200 bg-green-50 mb-6">
                  <Check size={24} className="text-green-700" />
                </div>
                <h3 className="font-serif text-xl text-ink-900 mb-2">Message Sent</h3>
                <p className="text-sm text-ink-500">Thank you for reaching out. We'll get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-serif text-xl text-ink-900 mb-2">Send a Message</h2>
                <div>
                  <label className="label">Name *</label>
                  <input name="name" required value={form.name} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input name="email" type="email" required value={form.email} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label className="label">Message *</label>
                  <textarea name="message" required rows={5} value={form.message} onChange={handleChange} className="input resize-none" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending...' : <><Send size={14} /> Send Message</>}
                </button>
                {error && <p className="text-2xs text-red-600 text-center">{error}</p>}
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
