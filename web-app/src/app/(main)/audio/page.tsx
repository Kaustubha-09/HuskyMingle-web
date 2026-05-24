'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mic2, Users, Radio, X, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AudioRoom {
  id: string;
  title: string;
  description?: string;
  status: 'LIVE' | 'ENDED';
  maxSpeakers: number;
  participantCount: number;
  tags: string[];
  createdAt: string;
  host: { username: string; profile?: { name: string; avatar?: string } };
}

interface CreateRoomPayload {
  title: string;
  description: string;
  maxSpeakers: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HostAvatar({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="w-8 h-8 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[#8B0000] flex items-center justify-center text-white font-bold text-sm">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-red-500 animate-pulse text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
      <span className="w-1.5 h-1.5 rounded-full bg-white" />
      Live
    </span>
  );
}

function EndedBadge() {
  return (
    <span className="inline-flex items-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide">
      Ended
    </span>
  );
}

function RoomCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 animate-pulse space-y-3">
      <div className="flex items-start justify-between">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-12" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
    </div>
  );
}

function RoomCard({ room }: { room: AudioRoom }) {
  const isLive = room.status === 'LIVE';
  const hostName = room.host.profile?.name ?? room.host.username;

  const handleAction = () => {
    toast(isLive ? 'Joining room…' : 'This room has ended', {
      icon: isLive ? '🎤' : '📻',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      {/* Title + badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex-1">
          {room.title}
        </h3>
        {isLive ? <LiveBadge /> : <EndedBadge />}
      </div>

      {/* Host */}
      <div className="flex items-center gap-2">
        <HostAvatar name={hostName} avatar={room.host.profile?.avatar} />
        <div>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {hostName}
          </p>
          <p className="text-[10px] text-gray-500">@{room.host.username} · Host</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            🎤 {room.participantCount} listening
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} />
            {room.maxSpeakers} max
          </span>
        </div>

        <button
          onClick={handleAction}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            isLive
              ? 'bg-[#8B0000] hover:bg-[#6b0000] text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {isLive ? 'Join' : 'View'}
        </button>
      </div>

      {/* Tags */}
      {room.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {room.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateRoomModal({
  onClose,
  onSubmit,
  submitting,
}: {
  onClose: () => void;
  onSubmit: (data: CreateRoomPayload) => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxSpeakers, setMaxSpeakers] = useState(5);

  const canSubmit = title.trim().length > 0 && !submitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ title: title.trim(), description: description.trim(), maxSpeakers });
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
            Start Audio Room
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
              Room Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the conversation about?"
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
              placeholder="Tell people what to expect…"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/40 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Max Speakers
            </label>
            <div className="relative">
              <select
                value={maxSpeakers}
                onChange={(e) => setMaxSpeakers(Number(e.target.value))}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#8B0000]/40 appearance-none pr-9"
              >
                {[2, 5, 10, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} speakers
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
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
              {submitting ? 'Starting…' : 'Start Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AudioPage() {
  const [showModal, setShowModal] = useState(false);
  const qc = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery<AudioRoom[]>({
    queryKey: ['audio-rooms'],
    queryFn: async () => {
      const res = await api.get('/audio');
      return res.data;
    },
  });

  const createRoom = useMutation({
    mutationFn: (payload: CreateRoomPayload) => api.post('/audio', payload),
    onSuccess: () => {
      toast.success('Audio room started!');
      qc.invalidateQueries({ queryKey: ['audio-rooms'] });
      setShowModal(false);
    },
    onError: () => toast.error('Failed to start room'),
  });

  const liveRooms = rooms.filter((r) => r.status === 'LIVE');
  const otherRooms = rooms.filter((r) => r.status !== 'LIVE');
  const isEmpty = !isLoading && rooms.length === 0;

  return (
    <>
      {showModal && (
        <CreateRoomModal
          onClose={() => setShowModal(false)}
          onSubmit={(data) => createRoom.mutate(data)}
          submitting={createRoom.isPending}
        />
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audio Rooms
          </h1>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            <Radio size={15} />
            Start Room
          </button>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Overall empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Mic2 size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No audio rooms yet
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Start a conversation and invite others to listen
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#8B0000] hover:bg-[#6b0000] text-white font-semibold px-5 py-2.5 rounded-full text-sm transition-colors"
            >
              Start one!
            </button>
          </div>
        )}

        {/* Live rooms section */}
        {!isLoading && !isEmpty && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                Live Now
              </h2>
            </div>

            {liveRooms.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center text-center">
                <p className="text-gray-500 text-sm mb-3">
                  No live rooms right now
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="text-[#8B0000] font-semibold text-sm hover:underline"
                >
                  Start one!
                </button>
              </div>
            ) : (
              liveRooms.map((room) => <RoomCard key={room.id} room={room} />)
            )}
          </div>
        )}

        {/* Past / upcoming rooms */}
        {!isLoading && !isEmpty && otherRooms.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
              Recent Rooms
            </h2>
            {otherRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
