'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2, Upload, Play } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Reel {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  duration: number;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  author: { username: string; profile?: { name: string; avatar?: string } };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h << 5) - h + id.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const GRADIENTS: [string, string][] = [
  ['from-purple-900', 'to-pink-700'],
  ['from-blue-900', 'to-cyan-600'],
  ['from-rose-900', 'to-orange-600'],
  ['from-green-900', 'to-teal-600'],
  ['from-indigo-900', 'to-violet-600'],
  ['from-amber-900', 'to-yellow-600'],
  ['from-slate-900', 'to-blue-700'],
  ['from-fuchsia-900', 'to-pink-600'],
];

function gradientFor(id: string): [string, string] {
  return GRADIENTS[hashId(id) % GRADIENTS.length];
}

function fmtDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function fmtCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-9 h-9 rounded-full object-cover border-2 border-white/60"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-[#8B0000] border-2 border-white/60 flex items-center justify-center text-white font-bold text-sm">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SideAction({
  Icon,
  count,
  active,
  onClick,
}: {
  Icon: React.ElementType;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div
        className={`p-2.5 rounded-full bg-black/30 backdrop-blur-sm transition-transform active:scale-90 ${
          active ? 'text-pink-400' : 'text-white'
        }`}
      >
        <Icon size={22} fill={active ? 'currentColor' : 'none'} />
      </div>
      {count !== undefined && (
        <span className="text-white text-xs font-semibold drop-shadow">
          {fmtCount(count)}
        </span>
      )}
    </button>
  );
}

function PlaceholderCard({ index }: { index: number }) {
  const [from, to] = GRADIENTS[index % GRADIENTS.length];
  return (
    <div className="snap-start h-[85vh] flex-shrink-0 w-full flex items-center justify-center">
      <div
        className={`relative w-full max-w-sm mx-auto aspect-[9/16] max-h-[80vh] rounded-2xl bg-gradient-to-b ${from} ${to} flex items-center justify-center`}
      >
        <div className="text-center text-white/60">
          <Play size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-semibold">No reels yet</p>
          <p className="text-sm opacity-70">Be the first to upload!</p>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="snap-start h-[85vh] flex-shrink-0 w-full flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto aspect-[9/16] max-h-[80vh] rounded-2xl bg-gray-800 animate-pulse" />
    </div>
  );
}

function ReelCard({
  reel,
  liked,
  onLike,
}: {
  reel: Reel;
  liked: boolean;
  onLike: () => void;
}) {
  const [from, to] = gradientFor(reel.id);
  const authorName = reel.author.profile?.name ?? reel.author.username;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: reel.caption ?? 'Check this reel', url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    }
  };

  return (
    <div className="snap-start h-[85vh] flex-shrink-0 w-full flex items-center justify-center">
      <div
        className={`relative w-full max-w-sm mx-auto aspect-[9/16] max-h-[80vh] rounded-2xl bg-gradient-to-b ${from} ${to} overflow-hidden`}
      >
        {reel.thumbnailUrl && (
          <img
            src={reel.thumbnailUrl}
            alt={reel.caption ?? ''}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Duration badge */}
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-full">
          {fmtDuration(reel.duration)}
        </div>

        {/* Right-side actions */}
        <div className="absolute right-3 bottom-28 flex flex-col gap-5">
          <SideAction
            Icon={Heart}
            count={reel.likeCount + (liked ? 1 : 0)}
            active={liked}
            onClick={onLike}
          />
          <SideAction Icon={MessageCircle} count={reel.commentCount} />
          <SideAction Icon={Share2} onClick={handleShare} />
        </div>

        {/* Bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-14">
          <div className="flex items-center gap-2 mb-1.5">
            <Avatar name={authorName} avatar={reel.author.profile?.avatar} />
            <span className="text-white font-semibold text-sm drop-shadow">
              @{reel.author.username}
            </span>
          </div>
          {reel.caption && (
            <p className="text-white/90 text-sm line-clamp-2 drop-shadow">
              {reel.caption}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReelsPage() {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const { data: reels = [], isLoading } = useQuery<Reel[]>({
    queryKey: ['reels'],
    queryFn: async () => {
      const res = await api.get('/reels');
      return res.data;
    },
  });

  const toggleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        toast('Liked!', { icon: '❤️' });
      }
      return next;
    });
  };

  const isEmpty = !isLoading && reels.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-20">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Reels</h1>
        <button className="flex items-center gap-2 bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors">
          <Upload size={15} />
          Upload Reel
        </button>
      </div>

      {/* Scrollable feed */}
      <div className="flex-1 overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black">
        {isLoading && [0, 1, 2].map((i) => <SkeletonCard key={i} />)}

        {isEmpty && [0, 1, 2].map((i) => <PlaceholderCard key={i} index={i} />)}

        {!isLoading &&
          reels.map((reel) => (
            <ReelCard
              key={reel.id}
              reel={reel}
              liked={likedIds.has(reel.id)}
              onLike={() => toggleLike(reel.id)}
            />
          ))}
      </div>
    </div>
  );
}
