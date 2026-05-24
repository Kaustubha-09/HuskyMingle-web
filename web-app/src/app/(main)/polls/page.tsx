'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { BarChart2, Plus, X, ChevronDown, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow, isPast, differenceInHours, differenceInDays } from 'date-fns';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PollOption {
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  endsAt?: string;
  userVote: number | null;
  createdAt: string;
  author: { username: string; profile?: { name: string; avatar?: string } };
  _count: { votes: number };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeRemaining(endsAt: string): string {
  const hours = differenceInHours(new Date(endsAt), new Date());
  if (hours < 1) return 'less than an hour';
  if (hours < 24) return `${hours}h`;
  const days = differenceInDays(new Date(endsAt), new Date());
  return `${days}d`;
}

function authorName(poll: Poll) {
  return poll.author.profile?.name ?? poll.author.username;
}

function authorInitials(poll: Poll) {
  return authorName(poll).slice(0, 2).toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PollSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
      <div className="space-y-2 mt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function VoteBar({
  option,
  index,
  totalVotes,
  isVoted,
  isUserChoice,
  onVote,
  disabled,
}: {
  option: PollOption;
  index: number;
  totalVotes: number;
  isVoted: boolean;
  isUserChoice: boolean;
  onVote: (i: number) => void;
  disabled: boolean;
}) {
  const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

  if (isVoted) {
    return (
      <div
        className={`relative rounded-xl overflow-hidden border ${
          isUserChoice
            ? 'border-[#8B0000] bg-red-50 dark:bg-red-950'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
        }`}
      >
        {/* Progress fill */}
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-500 ${
            isUserChoice ? 'bg-[#8B0000]/15' : 'bg-gray-200 dark:bg-gray-700'
          }`}
          style={{ width: `${pct}%` }}
        />
        <div className="relative flex items-center justify-between px-3 py-2.5">
          <span className={`text-sm font-medium ${isUserChoice ? 'text-[#8B0000]' : 'text-gray-700 dark:text-gray-300'}`}>
            {option.text}
            {isUserChoice && <CheckCircle size={13} className="inline ml-1.5 mb-0.5 text-[#8B0000]" />}
          </span>
          <span className={`text-xs font-bold ${isUserChoice ? 'text-[#8B0000]' : 'text-gray-500'}`}>{pct}%</span>
        </div>
      </div>
    );
  }

  return (
    <button
      disabled={disabled}
      onClick={() => onVote(index)}
      className="w-full text-left px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-[#8B0000] hover:bg-red-50 dark:hover:bg-red-950 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {option.text}
    </button>
  );
}

function PollCard({
  poll,
  onVote,
  isPending,
}: {
  poll: Poll;
  onVote: (pollId: string, optionIndex: number) => void;
  isPending: boolean;
}) {
  const isVoted  = poll.userVote !== null;
  const isEnded  = !!poll.endsAt && isPast(new Date(poll.endsAt));
  const disabled = isVoted || isEnded || isPending;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      {/* Author row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-[#8B0000] flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white">{authorInitials(poll)}</span>
        </div>
        <span className="text-xs text-gray-500 flex-1">{authorName(poll)}</span>
        {isEnded ? (
          <span className="text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            Ended
          </span>
        ) : poll.endsAt ? (
          <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full font-medium">
            <Clock size={10} /> {timeRemaining(poll.endsAt)} left
          </span>
        ) : null}
        {isVoted && !isEnded && (
          <span className="text-xs font-semibold text-[#8B0000] bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-full">
            You voted
          </span>
        )}
      </div>

      {/* Question */}
      <p className="font-bold text-sm text-gray-900 dark:text-white mb-3 leading-snug">{poll.question}</p>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((opt, i) => (
          <VoteBar
            key={i}
            option={opt}
            index={i}
            totalVotes={poll.totalVotes}
            isVoted={isVoted || isEnded}
            isUserChoice={poll.userVote === i}
            onVote={(idx) => onVote(poll.id, idx)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 mt-3">
        {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''} ·{' '}
        {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
      </p>
    </div>
  );
}

function CreatePollModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState('');
  const [options, setOptions]   = useState(['', '']);
  const [endsAt, setEndsAt]     = useState('');

  const addOption = useCallback(() => {
    if (options.length < 6) setOptions((prev) => [...prev, '']);
  }, [options.length]);

  const removeOption = useCallback((i: number) => {
    setOptions((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const updateOption = useCallback((i: number, val: string) => {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? val : o)));
  }, []);

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        question,
        options: options.filter((o) => o.trim()),
      };
      if (endsAt) payload.endsAt = new Date(endsAt).toISOString();
      const res = await api.post('/polls', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      toast.success('Poll created!');
      onClose();
    },
    onError: () => toast.error('Failed to create poll'),
  });

  const handleSubmit = useCallback(() => {
    if (!question.trim()) return toast.error('Question is required');
    const filled = options.filter((o) => o.trim());
    if (filled.length < 2) return toast.error('Add at least 2 options');
    createMutation.mutate();
  }, [question, options, createMutation]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-base text-gray-900 dark:text-white">Create Poll</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Question */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              placeholder="Ask the Husky community something..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#8B0000] resize-none"
            />
          </div>

          {/* Options */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Options ({options.length}/6)
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#8B0000]"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => removeOption(i)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <button
                onClick={addOption}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#8B0000] hover:text-[#6b0000] transition-colors"
              >
                <Plus size={13} /> Add option
              </button>
            )}
          </div>

          {/* End date (optional) */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              End Date (optional)
            </label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#8B0000]"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="w-full py-2.5 bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {createMutation.isPending ? 'Creating…' : 'Create Poll'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PollsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const fetchPolls = useCallback(async (): Promise<Poll[]> => {
    const res = await api.get('/polls');
    return res.data;
  }, []);

  const { data: polls = [], isLoading } = useQuery<Poll[]>({
    queryKey: ['polls'],
    queryFn: fetchPolls,
    onError: () => toast.error('Failed to load polls'),
  } as any);

  const voteMutation = useMutation({
    mutationFn: async ({ pollId, optionIndex }: { pollId: string; optionIndex: number }) => {
      const res = await api.post(`/polls/${pollId}/vote`, { optionIndex });
      return res.data;
    },
    onMutate: async ({ pollId, optionIndex }) => {
      await queryClient.cancelQueries({ queryKey: ['polls'] });
      const prev = queryClient.getQueryData<Poll[]>(['polls']);

      queryClient.setQueryData<Poll[]>(['polls'], (old = []) =>
        old.map((p) => {
          if (p.id !== pollId) return p;
          const updatedOptions = p.options.map((o, i) => ({
            ...o,
            votes: o.votes + (i === optionIndex ? 1 : 0),
          }));
          return {
            ...p,
            options: updatedOptions,
            totalVotes: p.totalVotes + 1,
            userVote: optionIndex,
          };
        }),
      );

      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) queryClient.setQueryData(['polls'], ctx.prev);
      toast.error('Vote failed');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['polls'] }),
  });

  const handleVote = useCallback(
    (pollId: string, optionIndex: number) => {
      voteMutation.mutate({ pollId, optionIndex });
    },
    [voteMutation],
  );

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart2 size={22} className="text-[#8B0000]" />
          <h1 className="font-bold text-2xl text-gray-900 dark:text-white">Polls</h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={15} /> Create Poll
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <PollSkeleton key={i} />)}
        </div>
      ) : polls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BarChart2 size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
          <p className="font-medium text-gray-700 dark:text-gray-300">No polls yet — start a conversation!</p>
          <p className="text-sm text-gray-400 mt-1">Create a poll to get the Husky community's opinion.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              onVote={handleVote}
              isPending={voteMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && <CreatePollModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
