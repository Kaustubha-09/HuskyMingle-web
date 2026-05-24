'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  isNuOfficial: boolean;
  isJoined: boolean;
  memberCount: number;
  postCount: number;
  _count: { members: number; posts: number };
}

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  isPinned: boolean;
  userVote: number;
  tags: string[];
  createdAt: string;
  author: { username: string; profile?: { name: string; avatar?: string } };
}

// ── Community Card ────────────────────────────────────────────────────────────

function CommunityCard({ c, onSelect }: { c: Community; onSelect: () => void }) {
  const qc = useQueryClient();
  const join = useMutation({
    mutationFn: () => api.post(`/communities/${c.id}/join`),
    onSuccess: (res) => {
      toast.success(res.data.joined ? `Joined ${c.name}` : `Left ${c.name}`);
      qc.invalidateQueries({ queryKey: ['communities'] });
    },
  });

  const categoryColors: Record<string, string> = {
    College: 'bg-blue-100 text-blue-700',
    Identity: 'bg-purple-100 text-purple-700',
    Career: 'bg-green-100 text-green-700',
    Wellness: 'bg-pink-100 text-pink-700',
    Interest: 'bg-orange-100 text-orange-700',
    Academic: 'bg-indigo-100 text-indigo-700',
    University: 'bg-red-100 text-red-700',
    'Campus Life': 'bg-teal-100 text-teal-700',
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 hover:border-[#8B0000] transition-all cursor-pointer group"
      onClick={onSelect}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B0000] to-[#5a0000] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {c.isNuOfficial ? '🐾' : c.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm group-hover:text-[#8B0000] transition-colors truncate">{c.name}</span>
            {c.isNuOfficial && <span className="text-xs bg-red-100 text-[#8B0000] px-2 py-0.5 rounded-full font-semibold flex-shrink-0">🐾 NU</span>}
            {c.category && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${categoryColors[c.category] ?? 'bg-gray-100 text-gray-600'}`}>
                {c.category}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{c.description}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>👥 {(c._count.members).toLocaleString()} members</span>
            <span>📝 {(c._count.posts).toLocaleString()} posts</span>
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); join.mutate(); }}
          disabled={join.isPending}
          className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            c.isJoined
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-red-50 hover:text-red-600'
              : 'bg-[#8B0000] text-white hover:bg-[#6b0000]'
          }`}
        >
          {c.isJoined ? 'Joined' : 'Join'}
        </button>
      </div>
    </div>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({ post, communityId }: { post: CommunityPost; communityId: string }) {
  const qc = useQueryClient();
  const [localVote, setLocalVote] = useState(post.userVote);
  const [score, setScore] = useState(post.upvotes - post.downvotes);

  const vote = useMutation({
    mutationFn: (value: number) => api.post(`/communities/posts/${post.id}/vote`, { value }),
    onMutate: (value) => {
      const prev = localVote;
      const delta = prev === value ? -value : value - prev;
      setScore(s => s + delta);
      setLocalVote(prev === value ? 0 : value);
    },
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex gap-3">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
          <button onClick={() => vote.mutate(1)} className={`p-1 rounded transition-colors ${localVote === 1 ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'}`}>
            ▲
          </button>
          <span className={`text-xs font-bold ${score > 0 ? 'text-orange-500' : score < 0 ? 'text-blue-500' : 'text-gray-500'}`}>{score}</span>
          <button onClick={() => vote.mutate(-1)} className={`p-1 rounded transition-colors ${localVote === -1 ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}>
            ▼
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {post.isPinned && <span className="text-xs text-green-600 font-semibold">📌 Pinned</span>}
            <span className="text-xs text-gray-500">
              Posted by <span className="font-medium">{post.author.profile?.name ?? post.author.username}</span>
              {' · '}{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
          <h3 className="font-semibold text-sm mb-1.5">{post.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{post.content}</p>
          {post.tags.length > 0 && (
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {post.tags.map(t => <span key={t} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{t}</span>)}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>💬 {post.commentCount} comments</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Community Detail ──────────────────────────────────────────────────────────

function CommunityDetail({ community, onBack }: { community: Community; onBack: () => void }) {
  const qc = useQueryClient();
  const [sort, setSort] = useState<'hot' | 'new' | 'top'>('hot');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  const { data: posts = [], isLoading } = useQuery<CommunityPost[]>({
    queryKey: ['community-posts', community.id, sort],
    queryFn: async () => {
      const res = await api.get(`/communities/${community.id}/posts`, { params: { sort } });
      return res.data;
    },
  });

  const join = useMutation({
    mutationFn: () => api.post(`/communities/${community.id}/join`),
    onSuccess: (res) => {
      toast.success(res.data.joined ? 'Joined!' : 'Left community');
      qc.invalidateQueries({ queryKey: ['communities'] });
    },
  });

  const createPost = useMutation({
    mutationFn: () => api.post(`/communities/${community.id}/posts`, form),
    onSuccess: () => {
      toast.success('Post created!');
      setForm({ title: '', content: '' });
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ['community-posts', community.id] });
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8B0000] to-[#5a0000] rounded-2xl p-5 text-white mb-4">
        <button onClick={onBack} className="text-red-200 hover:text-white text-sm mb-3 flex items-center gap-1 transition-colors">
          ← Back to Communities
        </button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
            {community.isNuOfficial ? '🐾' : community.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{community.name}</h1>
              {community.isNuOfficial && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Official</span>}
            </div>
            <p className="text-red-200 text-sm mt-0.5">
              {community._count.members.toLocaleString()} members · {community._count.posts.toLocaleString()} posts
            </p>
          </div>
          <button
            onClick={() => join.mutate()}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              community.isJoined ? 'bg-white/20 hover:bg-white/30' : 'bg-white text-[#8B0000] hover:bg-red-50'
            }`}
          >
            {community.isJoined ? 'Joined ✓' : 'Join'}
          </button>
        </div>
        {community.description && <p className="text-red-100 text-sm mt-3">{community.description}</p>}
      </div>

      {/* Sort + Create */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {(['hot', 'new', 'top'] as const).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${sort === s ? 'bg-[#8B0000] text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-[#8B0000]'}`}>
              {s === 'hot' ? '🔥 Hot' : s === 'new' ? '✨ New' : '⭐ Top'}
            </button>
          ))}
        </div>
        {community.isJoined && (
          <button onClick={() => setShowCreate(s => !s)}
            className="px-3 py-1.5 bg-[#8B0000] text-white rounded-lg text-sm font-semibold hover:bg-[#6b0000] transition-colors">
            + Post
          </button>
        )}
      </div>

      {/* Create post form */}
      {showCreate && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Post title..."
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
          />
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm mb-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button
              onClick={() => createPost.mutate()}
              disabled={!form.title.trim() || !form.content.trim() || createPost.isPending}
              className="px-4 py-1.5 bg-[#8B0000] text-white rounded-lg text-sm font-semibold hover:bg-[#6b0000] disabled:opacity-50 transition-colors"
            >
              {createPost.isPending ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-2xl mb-2">📝</p>
          <p className="font-medium">No posts yet</p>
          <p className="text-sm mt-1">{community.isJoined ? 'Be the first to post!' : 'Join to start posting'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(p => <PostCard key={p.id} post={p} communityId={community.id} />)}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const CATEGORIES = ['All', 'College', 'Identity', 'Career', 'Wellness', 'Interest', 'Academic', 'Campus Life', 'University'];

export default function CommunitiesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<Community | null>(null);
  const [tab, setTab] = useState<'discover' | 'mine'>('discover');

  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ['communities', search, category, tab],
    queryFn: async () => {
      if (tab === 'mine') {
        const res = await api.get('/communities/mine');
        return res.data;
      }
      const res = await api.get('/communities', {
        params: {
          search: search || undefined,
          category: category !== 'All' ? category : undefined,
          limit: 50,
        },
      });
      return res.data;
    },
  });

  if (selected) {
    return <CommunityDetail community={selected} onBack={() => setSelected(null)} />;
  }

  const nuOfficial = communities.filter(c => c.isNuOfficial);
  const other = communities.filter(c => !c.isNuOfficial);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Communities</h1>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {(['discover', 'mine'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white dark:bg-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>
              {t === 'discover' ? '🔍 Discover' : '⭐ My Communities'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'discover' && (
        <>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search communities..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
          />
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${category === cat ? 'bg-[#8B0000] text-white' : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-[#8B0000]'}`}>
                {cat}
              </button>
            ))}
          </div>
        </>
      )}

      {isLoading ? (
        <div className="grid gap-3">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div>
          {tab === 'discover' && nuOfficial.length > 0 && category === 'All' && !search && (
            <>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">🐾 Official NU Communities</p>
              <div className="grid gap-3 mb-6">
                {nuOfficial.map(c => <CommunityCard key={c.id} c={c} onSelect={() => setSelected(c)} />)}
              </div>
              {other.length > 0 && <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Student Communities</p>}
            </>
          )}
          <div className="grid gap-3">
            {(category === 'All' && !search && tab === 'discover' ? other : communities).map(c => (
              <CommunityCard key={c.id} c={c} onSelect={() => setSelected(c)} />
            ))}
          </div>
          {communities.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-2xl mb-2">{tab === 'mine' ? '⭐' : '🔍'}</p>
              <p className="font-medium">{tab === 'mine' ? 'No communities joined yet' : 'No communities found'}</p>
              <p className="text-sm mt-1">{tab === 'mine' ? 'Discover communities below' : 'Try a different search'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
