'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark,
  X,
  FileText,
  ShoppingBag,
  Briefcase,
  CalendarDays,
  FolderPlus,
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

type BookmarkType = 'POST' | 'PRODUCT' | 'JOB' | 'EVENT';

interface BookmarkItem {
  id: string;
  targetType: BookmarkType;
  createdAt: string;
  post?: {
    id: string;
    content: string;
    author: { username: string; profile?: { name: string } };
  };
  product?: { id: string; title: string; price: number; images: string[] };
  job?: { id: string; title: string; company: string };
  event?: { id: string; title: string; startDate: string };
}

// ─── Filter config ────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: BookmarkType | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Posts', value: 'POST' },
  { label: 'Products', value: 'PRODUCT' },
  { label: 'Jobs', value: 'JOB' },
  { label: 'Events', value: 'EVENT' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-gray-500 hover:text-red-600 transition-colors"
      aria-label="Remove bookmark"
    >
      <X size={14} />
    </button>
  );
}

function PostCard({
  item,
  onRemove,
}: {
  item: BookmarkItem;
  onRemove: () => void;
}) {
  const authorName =
    item.post?.author.profile?.name ?? item.post?.author.username ?? 'Unknown';
  const content = item.post?.content ?? '';

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <RemoveButton onClick={onRemove} />
      <div className="flex items-start gap-3 pr-6">
        <div className="mt-0.5 p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex-shrink-0">
          <FileText size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 mb-1">{authorName}</p>
          <p className="text-sm text-gray-900 dark:text-white line-clamp-3 leading-relaxed">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  item,
  onRemove,
}: {
  item: BookmarkItem;
  onRemove: () => void;
}) {
  const title = item.product?.title ?? 'Product';
  const price = item.product?.price ?? 0;
  const image = item.product?.images?.[0];

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <RemoveButton onClick={onRemove} />
      {image ? (
        <img src={image} alt={title} className="w-full h-32 object-cover" />
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-amber-200 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center">
          <ShoppingBag size={32} className="text-orange-400" />
        </div>
      )}
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
          {title}
        </p>
        <p className="text-sm font-bold text-[#8B0000]">
          {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
        </p>
      </div>
    </div>
  );
}

function JobCard({
  item,
  onRemove,
}: {
  item: BookmarkItem;
  onRemove: () => void;
}) {
  const title = item.job?.title ?? 'Job Listing';
  const company = item.job?.company ?? 'Company';
  const initial = company.charAt(0).toUpperCase();

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <RemoveButton onClick={onRemove} />
      <div className="flex items-center gap-3 pr-6">
        <div className="w-10 h-10 rounded-xl bg-[#8B0000] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </p>
          <p className="text-xs text-gray-500 truncate">{company}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
        <Briefcase size={12} />
        <span>Job</span>
      </div>
    </div>
  );
}

function EventCard({
  item,
  onRemove,
}: {
  item: BookmarkItem;
  onRemove: () => void;
}) {
  const title = item.event?.title ?? 'Event';
  const date = item.event?.startDate ? new Date(item.event.startDate) : null;
  const day = date ? date.getDate() : '--';
  const month = date ? date.toLocaleString('default', { month: 'short' }) : '---';

  return (
    <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <RemoveButton onClick={onRemove} />
      <div className="flex items-center gap-3 pr-6">
        <div className="w-12 h-12 rounded-xl bg-[#8B0000] flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-semibold uppercase leading-none">
            {month}
          </span>
          <span className="text-white text-lg font-bold leading-none">{day}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
            {title}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <CalendarDays size={12} />
            <span>Event</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookmarkCard({
  item,
  onRemove,
}: {
  item: BookmarkItem;
  onRemove: () => void;
}) {
  if (item.targetType === 'POST') return <PostCard item={item} onRemove={onRemove} />;
  if (item.targetType === 'PRODUCT') return <ProductCard item={item} onRemove={onRemove} />;
  if (item.targetType === 'JOB') return <JobCard item={item} onRemove={onRemove} />;
  if (item.targetType === 'EVENT') return <EventCard item={item} onRemove={onRemove} />;
  return null;
}

function FilterPills({
  active,
  onChange,
}: {
  active: BookmarkType | 'ALL';
  onChange: (v: BookmarkType | 'ALL') => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            active === f.value
              ? 'bg-[#8B0000] text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <Bookmark size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Nothing saved yet
      </h3>
      <p className="text-gray-500 text-sm max-w-xs">
        Save posts, products, and events to find them here
      </p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-gray-100 dark:bg-gray-800 rounded-2xl h-28 animate-pulse"
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BookmarksPage() {
  const [tab, setTab] = useState<'saved' | 'collections'>('saved');
  const [filter, setFilter] = useState<BookmarkType | 'ALL'>('ALL');
  const qc = useQueryClient();

  const { data: bookmarks = [], isLoading } = useQuery<BookmarkItem[]>({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const res = await api.get('/bookmarks');
      return res.data;
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/bookmarks/${id}`),
    onSuccess: () => {
      toast.success('Bookmark removed');
      qc.invalidateQueries({ queryKey: ['bookmarks'] });
    },
    onError: () => toast.error('Failed to remove bookmark'),
  });

  const filtered =
    filter === 'ALL' ? bookmarks : bookmarks.filter((b) => b.targetType === filter);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bookmarks</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {(['saved', 'collections'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-[#8B0000] text-[#8B0000]'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t === 'saved' ? 'All Saved' : 'Collections'}
          </button>
        ))}
      </div>

      {/* All Saved tab */}
      {tab === 'saved' && (
        <div className="space-y-4">
          <FilterPills active={filter} onChange={setFilter} />

          {isLoading && <SkeletonGrid />}

          {!isLoading && filtered.length === 0 && <EmptyState />}

          {!isLoading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((item) => (
                <BookmarkCard
                  key={item.id}
                  item={item}
                  onRemove={() => remove.mutate(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collections tab */}
      {tab === 'collections' && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <button className="flex items-center gap-2 bg-[#8B0000] hover:bg-[#6b0000] text-white font-semibold px-5 py-2.5 rounded-full transition-colors">
            <FolderPlus size={16} />
            Create Collection
          </button>
          <p className="text-gray-500 text-sm max-w-xs">
            Organize your saves into collections
          </p>
        </div>
      )}
    </div>
  );
}
