'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Image, Video, BarChart2, FileText, Send, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const postTypes = [
  { type: 'TEXT', label: 'Post', icon: Send },
  { type: 'PHOTO', label: 'Photo', icon: Image },
  { type: 'VIDEO', label: 'Video', icon: Video },
  { type: 'BLOG', label: 'Article', icon: FileText },
  { type: 'POLL', label: 'Poll', icon: BarChart2 },
];

export function CreatePost() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('TEXT');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const hashtags = content.match(/#(\w+)/g)?.map(h => h.slice(1)) || [];
      await api.post('/posts', { type, content, title: title || undefined, hashtags, visibility: 'PUBLIC' });
      setContent('');
      setTitle('');
      setExpanded(false);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Posted!');
    } catch {
      toast.error('Failed to post');
    } finally {
      setLoading(false);
    }
  };

  const name = user?.profile?.name || user?.username || '';
  const avatar = user?.profile?.avatar;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-[#8B0000] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
          {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : name[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          {expanded && type === 'BLOG' && (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title..."
              className="w-full text-base font-semibold bg-transparent border-b border-gray-200 dark:border-gray-700 pb-2 mb-3 outline-none placeholder-gray-400"
            />
          )}
          <textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); setExpanded(true); }}
            onFocus={() => setExpanded(true)}
            placeholder="What's on your mind? Share something with the campus..."
            rows={expanded ? 4 : 1}
            className="w-full bg-transparent resize-none outline-none text-sm placeholder-gray-400 leading-relaxed"
          />

          {expanded && (
            <>
              {/* Post type selector */}
              <div className="flex gap-2 mt-2 mb-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                {postTypes.map(({ type: t, label, icon: Icon }) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      type === t ? 'bg-[#8B0000] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setExpanded(false); setContent(''); }}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <X size={12} /> Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!content.trim() || loading}
                  className="px-5 py-2 bg-[#8B0000] text-white rounded-full text-sm font-semibold disabled:opacity-50 hover:bg-[#6b0000] transition-colors flex items-center gap-2"
                >
                  {loading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  Post
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
