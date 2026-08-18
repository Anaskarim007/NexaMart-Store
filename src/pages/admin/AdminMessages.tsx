import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/utils';
import type { ContactMessage } from '@/types';
import { Trash2, Mail, MailOpen, X } from 'lucide-react';

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (filter === 'unread') query = query.eq('read', false);
    if (filter === 'read') query = query.eq('read', true);
    const { data } = await query;
    setMessages(data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const markRead = async (msg: ContactMessage, read: boolean) => {
    await supabase.from('contact_messages').update({ read }).eq('id', msg.id);
    fetchMessages();
    if (selected?.id === msg.id) setSelected({ ...msg, read });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await supabase.from('contact_messages').delete().eq('id', id);
    if (selected?.id === id) setSelected(null);
    fetchMessages();
  };

  const openMessage = async (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.read) {
      await supabase.from('contact_messages').update({ read: true }).eq('id', msg.id);
      fetchMessages();
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink-900">Messages</h1>
        <p className="text-sm text-ink-500 mt-1">Contact form submissions</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'unread', 'read'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-2xs uppercase tracking-widest px-4 py-2 border transition-colors ${
              filter === f ? 'bg-ink-900 text-ivory-50 border-ink-900' : 'bg-white text-ink-500 border-ink-200 hover:border-ink-900'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-ink-400 text-sm py-20">Loading messages...</div>
      ) : messages.length === 0 ? (
        <div className="text-center text-ink-400 text-sm py-20">No messages found.</div>
      ) : (
        <div className="bg-white border border-ink-100 divide-y divide-ink-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              onClick={() => openMessage(msg)}
              className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-ivory-50/50 transition-colors ${!msg.read ? 'bg-champagne-50/30' : ''}`}
            >
              <div className="flex-shrink-0">
                {msg.read ? <MailOpen size={16} className="text-ink-300" /> : <Mail size={16} className="text-champagne-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${!msg.read ? 'font-medium text-ink-900' : 'text-ink-700'}`}>{msg.name}</p>
                  {!msg.read && <span className="w-2 h-2 rounded-full bg-champagne-400" />}
                </div>
                <p className="text-2xs text-ink-500 truncate">{msg.email} — {msg.message.slice(0, 60)}...</p>
              </div>
              <p className="text-2xs text-ink-400 flex-shrink-0">{formatDateTime(msg.created_at)}</p>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                className="p-1.5 text-ink-400 hover:text-red-600 transition-colors flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Message detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 flex items-center justify-center p-4">
          <div className="bg-ivory-50 w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-ink-100">
              <h2 className="font-serif text-xl text-ink-900">Message</h2>
              <button onClick={() => setSelected(null)} className="p-1"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-2xs text-ink-400 uppercase tracking-widest mb-1">Name</p><p className="text-ink-900">{selected.name}</p></div>
                <div><p className="text-2xs text-ink-400 uppercase tracking-widest mb-1">Email</p><p className="text-ink-900">{selected.email}</p></div>
                <div><p className="text-2xs text-ink-400 uppercase tracking-widest mb-1">Phone</p><p className="text-ink-900">{selected.phone ?? '—'}</p></div>
                <div><p className="text-2xs text-ink-400 uppercase tracking-widest mb-1">Date</p><p className="text-ink-900">{formatDateTime(selected.created_at)}</p></div>
              </div>
              <div>
                <p className="text-2xs text-ink-400 uppercase tracking-widest mb-2">Message</p>
                <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-line bg-white border border-ink-100 p-4">{selected.message}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => markRead(selected, false)} className="btn-secondary flex-1">Mark Unread</button>
                <button onClick={() => handleDelete(selected.id)} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 flex-1">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
