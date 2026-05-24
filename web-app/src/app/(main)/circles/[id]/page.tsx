'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, UserPlus, X, MessageCircle } from 'lucide-react';
import { useCirclesStore } from '@/store/circles.store';

export default function CircleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { byId, remove, addMember, removeMember } = useCirclesStore();
  const circle = useCirclesStore(s => s.circles.find(c => c.id === id));

  const [handleInput, setHandleInput] = useState('');

  if (!circle) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
        <span className="text-4xl">🔍</span>
        <p className="font-semibold">Circle not found</p>
        <button onClick={() => router.back()} className="text-sm text-[#8B0000] hover:underline">Go back</button>
      </div>
    );
  }

  const handleAdd = () => {
    const handle = handleInput.trim().replace(/^@/, '');
    if (!handle || circle.memberHandles.includes(handle)) return;
    addMember(circle.id, handle);
    setHandleInput('');
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${circle.name}"? This cannot be undone.`)) return;
    remove(circle.id);
    router.replace('/circles');
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
          Circles
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>

      {/* Header card */}
      <div className="bg-gradient-to-br from-[#8B0000] to-[#5a0000] rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-4xl">
            {circle.emoji}
          </div>
          <div>
            <h1 className="font-bold text-2xl leading-tight">{circle.name}</h1>
            <p className="text-red-200 text-sm mt-0.5">
              {circle.memberHandles.length === 0
                ? 'No members yet'
                : `${circle.memberHandles.length} member${circle.memberHandles.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Members</p>

        {circle.memberHandles.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No members added yet.</p>
        ) : (
          <div className="space-y-2">
            {circle.memberHandles.map(handle => (
              <div
                key={handle}
                className="flex items-center gap-3 py-2 px-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#8B0000] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">{handle[0].toUpperCase()}</span>
                </div>
                <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">@{handle}</span>
                <button
                  onClick={() => removeMember(circle.id, handle)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-950 text-gray-400 hover:text-red-500 transition-all"
                  title="Remove member"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add member input */}
        <div className="flex gap-2 pt-1">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
            <input
              value={handleInput}
              onChange={e => setHandleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="username"
              className="w-full pl-7 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000] focus:border-transparent"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!handleInput.trim()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#8B0000] text-white text-sm font-semibold hover:bg-[#6b0000] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <UserPlus size={15} />
            Add
          </button>
        </div>
      </div>

      {/* Group chat placeholder */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center gap-2 text-center">
        <MessageCircle size={28} className="text-gray-400" />
        <p className="font-semibold text-gray-500 text-sm">Group chat coming soon</p>
        <p className="text-xs text-gray-400 max-w-xs">
          Soon you'll be able to message everyone in this circle at once.
        </p>
      </div>
    </div>
  );
}
