'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tv2, Eye, X, Calendar, Clock } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LiveStream {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  viewerCount: number;
  peakViewers: number;
  createdAt: string;
  streamer: { username: string; profile?: { name: string; avatar?: string } };
}

interface CreateStreamPayload {
  title: string;
  description: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

const THUMB_GRADIENTS: [string, string][] = [
  ['from-purple-800', 'to-pink-600'],
  ['from-blue-800', 'to-cyan-500'],
  ['from-rose-800', 'to-orange-500'],
  ['from-green-800', 'to-teal-500'],
  ['from-indigo-800', 'to-violet-600'],
  ['from-amber-800', 'to-yellow-500'],
];

function thumbGradient(id: string): [string, string] {
  return THUMB_GRADIENTS[hashStr(id) % THUMB_GRADIENTS.length];
}

function fmtCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StreamerAvatar({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-8 h-8 rounded-full object-cover border-2 border-white/30"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[#8B0000] border-2 border-white/30 flex items-center justify-center text-white font-bold text-sm">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function StatusBadge({ status }: { status: LiveStream['status'] }) {
  if (status === 'LIVE') {
    return (
      <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        Live
      </span>
    );
  }
  if (status === 'SCHEDULED') {
    return (
      <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
        <Calendar size={10} />
        Scheduled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
      Ended
    </span>
  );
}

/* Featured banner card for LIVE streams */
function FeaturedStreamCard({
  stream,
  onClick,
}: {
  stream: LiveStream;
  onClick: () => void;
}) {
  const [from, to] = thumbGradient(stream.id);
  const streamerName = stream.streamer.profile?.name ?? stream.streamer.username;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-br ${from} ${to} group`}
      onClick={onClick}
    >
      {stream.thumbnail && (
        <img
          src={stream.thumbnail}
          alt={stream.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* Overlay */}
      <div className="relative bg-black/40 group-hover:bg-black/50 transition-colors p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <StatusBadge status={stream.status} />
          <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            <Eye size={12} />
            <span>{fmtCount(stream.viewerCount)}</span>
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 leading-tight">
          {stream.title}
        </h3>
        {stream.description && (
          <p className="text-white/80 text-sm line-clamp-2 mb-3">
            {stream.description}
          </p>
        )}

        <div className="flex items-center gap-2">
          <StreamerAvatar
            name={streamerName}
            avatar={stream.streamer.profile?.avatar}
          />
          <span className="text-white/90 text-sm font-medium">{streamerName}</span>
        </div>
      </div>
    </div>
  );
}

/* Scheduled list item */
function ScheduledStreamRow({
  stream,
  onClick,
}: {
  stream: LiveStream;
  onClick: () => void;
}) {
  const [from, to] = thumbGradient(stream.id);
  const streamerName = stream.streamer.profile?.name ?? stream.streamer.username;

  return (
    <div
      className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-3 cursor-pointer hover:shadow-sm transition-shadow"
      onClick={onClick}
    >
      <div
        className={`w-16 h-14 rounded-xl bg-gradient-to-br ${from} ${to} flex-shrink-0 flex items-center justify-center`}
      >
        <Tv2 size={20} className="text-white/70" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {stream.title}
          </p>
          <StatusBadge status={stream.status} />
        </div>
        <p className="text-xs text-gray-500">{streamerName}</p>
        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
          <Clock size={10} />
          {relativeTime(stream.createdAt)}
        </div>
      </div>
    </div>
  );
}

/* Past stream compact card */
function PastStreamCard({
  stream,
  onClick,
}: {
  stream: LiveStream;
  onClick: () => void;
}) {
  const [from, to] = thumbGradient(stream.id);
  const streamerName = stream.streamer.profile?.name ?? stream.streamer.username;

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden cursor-pointer hover:shadow-sm transition-shadow"
      onClick={onClick}
    >
      {stream.thumbnail ? (
        <img
          src={stream.thumbnail}
          alt={stream.title}
          className="w-full h-28 object-cover"
        />
      ) : (
        <div
          className={`w-full h-28 bg-gradient-to-br ${from} ${to} flex items-center justify-center`}
        >
          <Tv2 size={24} className="text-white/50" />
        </div>
      )}
      <div className="p-3">
        <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
          {stream.title}
        </p>
        <p className="text-[11px] text-gray-500 mb-1">{streamerName}</p>
        <div className="flex items-center gap-1 text-[11px] text-gray-400">
          <Eye size={11} />
          <span>{fmtCount(stream.peakViewers)} peak</span>
        </div>
      </div>
    </div>
  );
}

/* Skeleton components */
function FeaturedSkeleton() {
  return (
    <div className="rounded-2xl h-52 bg-gray-200 dark:bg-gray-800 animate-pulse" />
  );
}

function ListSkeleton() {
  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-3 animate-pulse">
      <div className="w-16 h-14 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  );
}

/* "Stream unavailable" overlay message */
function StreamNotice({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Tv2 size={36} className="mx-auto mb-3 text-gray-400" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
          Demo Mode
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Live stream embed not available in demo
        </p>
        <button
          onClick={onClose}
          className="bg-[#8B0000] hover:bg-[#6b0000] text-white font-semibold px-5 py-2 rounded-full text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* Go Live modal */
function GoLiveModal({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (data: CreateStreamPayload) => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const canSubmit = title.trim().length > 0 && !submitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ title: title.trim(), description: description.trim() });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Go Live
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Stream Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you streaming today?"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell viewers what to expect…"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/40 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 py-2.5 rounded-xl bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? 'Starting…' : 'Go Live'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LivePage() {
  const [showGoLive, setShowGoLive] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const qc = useQueryClient();

  const { data: streams = [], isLoading } = useQuery<LiveStream[]>({
    queryKey: ['live-streams'],
    queryFn: async () => {
      const res = await api.get('/streaming');
      return res.data;
    },
  });

  const createStream = useMutation({
    mutationFn: (payload: CreateStreamPayload) =>
      api.post('/streaming', payload),
    onSuccess: () => {
      toast.success('Stream created! Go live now');
      qc.invalidateQueries({ queryKey: ['live-streams'] });
      setShowGoLive(false);
    },
    onError: () => toast.error('Failed to create stream'),
  });

  const liveStreams = streams.filter((s) => s.status === 'LIVE');
  const scheduled = streams.filter((s) => s.status === 'SCHEDULED');
  const ended = streams.filter((s) => s.status === 'ENDED');
  const isEmpty = !isLoading && streams.length === 0;

  return (
    <>
      {showGoLive && (
        <GoLiveModal
          onClose={() => setShowGoLive(false)}
          onSubmit={(data) => createStream.mutate(data)}
          submitting={createStream.isPending}
        />
      )}
      {showNotice && <StreamNotice onClose={() => setShowNotice(false)} />}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Live
          </h1>
          <button
            onClick={() => setShowGoLive(true)}
            className="flex items-center gap-2 bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-white" />
            Go Live
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            <FeaturedSkeleton />
            <FeaturedSkeleton />
            {[1, 2, 3].map((i) => (
              <ListSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Tv2 size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No live streams
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Go live to connect with Huskies
            </p>
            <button
              onClick={() => setShowGoLive(true)}
              className="bg-[#8B0000] hover:bg-[#6b0000] text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors"
            >
              Go Live Now
            </button>
          </div>
        )}

        {/* Live Now */}
        {!isLoading && liveStreams.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Live Now
              </h2>
            </div>
            {liveStreams.map((stream) => (
              <FeaturedStreamCard
                key={stream.id}
                stream={stream}
                onClick={() => setShowNotice(true)}
              />
            ))}
          </div>
        )}

        {/* Scheduled */}
        {!isLoading && scheduled.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
              Upcoming
            </h2>
            {scheduled.map((stream) => (
              <ScheduledStreamRow
                key={stream.id}
                stream={stream}
                onClick={() => setShowNotice(true)}
              />
            ))}
          </div>
        )}

        {/* Past Streams */}
        {!isLoading && ended.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
              Past Streams
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {ended.map((stream) => (
                <PastStreamCard
                  key={stream.id}
                  stream={stream}
                  onClick={() => setShowNotice(true)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
