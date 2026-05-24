'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Users } from 'lucide-react';
import { useCirclesStore, type HMCircle } from '@/store/circles.store';

const EMOJI_OPTIONS = ['👥', '📚', '💻', '🎮', '🍕', '🐾', '🎓', '🏀', '🎬', '🎵', '✈️', '🧪', '💼', '🎨', '🔬', '🌱'];

function CreateModal({ onClose }: { onClose: () => void }) {
  const add = useCirclesStore(s => s.add);
  const router = useRouter();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('👥');
  const [memberText, setMemberText] = useState('');

  const parseHandles = (raw: string) =>
    raw
      .split(/[,\s\n]+/)
      .map(h => h.trim().replace(/^@/, ''))
      .filter(Boolean)
      .filter((h, i, arr) => arr.indexOf(h) === i);

  const handleCreate = () => {
    if (!name.trim()) return;
    const circle = add(name.trim(), emoji, parseHandles(memberText));
    onClose();
    router.push(`/circles/${circle.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">New Circle</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Emoji picker */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pick an emoji</p>
          <div className="grid grid-cols-8 gap-1.5">
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`text-xl p-1.5 rounded-lg transition-colors ${
                  emoji === e ? 'bg-[#8B0000] bg-opacity-10 ring-2 ring-[#8B0000]' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">Circle name</label>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. CS roommates"
            maxLength={40}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-transparent"
          />
        </div>

        {/* Members */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
            Members <span className="font-normal normal-case">(comma-separated @handles, optional)</span>
          </label>
          <textarea
            value={memberText}
            onChange={e => setMemberText(e.target.value)}
            placeholder="alice, bob, @charlie"
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-transparent resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-[#8B0000] text-white text-sm font-semibold hover:bg-[#6b0000] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function CircleRow({ circle }: { circle: HMCircle }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/circles/${circle.id}`)}
      className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3.5 flex items-center gap-4 hover:border-[#8B0000]/40 hover:shadow-sm transition-all text-left"
    >
      <div className="w-12 h-12 rounded-full bg-[#8B0000]/10 flex items-center justify-center text-2xl flex-shrink-0">
        {circle.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white truncate">{circle.name}</p>
        <p className="text-sm text-gray-500 mt-0.5">
          {circle.memberHandles.length === 0
            ? 'No members yet'
            : `${circle.memberHandles.length} member${circle.memberHandles.length !== 1 ? 's' : ''}`}
        </p>
      </div>
    </button>
  );
}

export default function CirclesPage() {
  const circles = useCirclesStore(s => s.circles);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-[#8B0000]" />
          <h1 className="font-bold text-2xl text-gray-900 dark:text-white">Circles</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8B0000] text-white text-sm font-semibold hover:bg-[#6b0000] transition-colors"
        >
          <Plus size={16} />
          New Circle
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Circles are private groups — only members can see posts shared to them.
      </p>

      {/* List */}
      {circles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="text-5xl">👥</span>
          <p className="font-bold text-lg text-gray-900 dark:text-white">No circles yet</p>
          <p className="text-sm text-gray-500 text-center max-w-xs">
            Create a circle to share posts with a specific group of people.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-[#8B0000] text-white text-sm font-semibold hover:bg-[#6b0000] transition-colors"
          >
            Create your first circle
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {circles.map(c => <CircleRow key={c.id} circle={c} />)}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
