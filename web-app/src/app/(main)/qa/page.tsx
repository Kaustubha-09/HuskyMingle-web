'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  HelpCircle,
  Plus,
  X,
  ArrowLeft,
  CheckCircle,
  Eye,
  MessageSquare,
  ChevronUp,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Answer {
  id: string;
  content: string;
  isAccepted: boolean;
  votes: number;
  createdAt: string;
  author: { username: string; profile?: { name: string; avatar?: string } };
}

interface Question {
  id: string;
  title: string;
  content: string;
  tags: string[];
  views: number;
  answerCount: number;
  isSolved: boolean;
  createdAt: string;
  author: { username: string; profile?: { name: string; avatar?: string } };
  _count: { answers: number };
  answers?: Answer[];
}

type FilterTab = 'all' | 'unanswered' | 'solved';
type SortKey   = 'newest' | 'most-answered' | 'most-viewed';

// ── Helpers ───────────────────────────────────────────────────────────────────

function displayName(author: Question['author']) {
  return author.profile?.name ?? author.username;
}

function initials(author: Question['author']) {
  return displayName(author).slice(0, 2).toUpperCase();
}

function applyFilter(questions: Question[], tab: FilterTab): Question[] {
  if (tab === 'unanswered') return questions.filter((q) => q._count.answers === 0);
  if (tab === 'solved')     return questions.filter((q) => q.isSolved);
  return questions;
}

function applySort(questions: Question[], sort: SortKey): Question[] {
  return [...questions].sort((a, b) => {
    if (sort === 'most-answered') return b._count.answers - a._count.answers;
    if (sort === 'most-viewed')   return b.views - a.views;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function QuestionSkeleton() {
  return (
    <div className="animate-pulse bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-full mb-1" />
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-4/5 mb-3" />
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800 rounded-full" />
        <div className="h-5 w-20 bg-gray-100 dark:bg-gray-800 rounded-full" />
      </div>
    </div>
  );
}

function TagChip({ tag }: { tag: string }) {
  return (
    <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950 text-[#8B0000] text-xs font-semibold rounded-full">
      {tag}
    </span>
  );
}

function QuestionRow({
  question,
  onClick,
}: {
  question: Question;
  onClick: () => void;
}) {
  const answerCount = question._count.answers;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 hover:border-[#8B0000] hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Stats column */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-0.5">
          <div className={`text-center px-2 py-1 rounded-xl text-xs font-bold ${
            question.isSolved
              ? 'bg-green-100 text-green-700'
              : answerCount > 0
              ? 'bg-blue-50 text-blue-600'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
          }`}>
            <span className="block text-base leading-none">{answerCount}</span>
            <span className="text-[10px]">ans</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{question.title}</p>
            {question.isSolved && (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-950 px-1.5 py-0.5 rounded-full flex-shrink-0">
                <CheckCircle size={10} /> Solved
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{question.content}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {question.tags.map((t) => <TagChip key={t} tag={t} />)}
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Eye size={11} /> {question.views}</span>
            <span>{displayName(question.author)}</span>
            <span>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function AnswerCard({
  answer,
  questionId,
  questionAuthorUsername,
  currentUsername,
}: {
  answer: Answer;
  questionId: string;
  questionAuthorUsername: string;
  currentUsername?: string;
}) {
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/qa/${questionId}/answers/${answer.id}/accept`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa', questionId] });
      queryClient.invalidateQueries({ queryKey: ['qa'] });
      toast.success('Answer accepted!');
    },
    onError: () => toast.error('Failed to accept answer'),
  });

  const canAccept = currentUsername === questionAuthorUsername && !answer.isAccepted;

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-2xl border p-4 ${
        answer.isAccepted
          ? 'border-green-400 dark:border-green-700'
          : 'border-gray-200 dark:border-gray-800'
      }`}
    >
      {answer.isAccepted && (
        <div className="flex items-center gap-1.5 text-green-600 text-xs font-bold mb-3">
          <CheckCircle size={13} /> Accepted Answer
        </div>
      )}

      <div className="flex gap-3">
        {/* Vote count */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <ChevronUp size={18} className="text-gray-300" />
          <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{answer.votes}</span>
        </div>

        {/* Answer body */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {answer.content}
          </p>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#8B0000] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{initials(answer.author)}</span>
              </div>
              <span className="text-xs text-gray-500">
                {displayName(answer.author)} ·{' '}
                {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
              </span>
            </div>
            {canAccept && (
              <button
                onClick={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
                className="flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
              >
                <CheckCircle size={13} /> Accept
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionDetail({
  questionId,
  currentUsername,
  onBack,
}: {
  questionId: string;
  currentUsername?: string;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const [answerText, setAnswerText] = useState('');

  const fetchDetail = useCallback(async (): Promise<Question> => {
    const res = await api.get(`/qa/${questionId}`);
    return res.data;
  }, [questionId]);

  const { data: question, isLoading } = useQuery<Question>({
    queryKey: ['qa', questionId],
    queryFn: fetchDetail,
    onError: () => toast.error('Failed to load question'),
  } as any);

  const addAnswerMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/qa/${questionId}/answers`, { content: answerText.trim() });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa', questionId] });
      queryClient.invalidateQueries({ queryKey: ['qa'] });
      setAnswerText('');
      toast.success('Answer posted!');
    },
    onError: () => toast.error('Failed to post answer'),
  });

  const handleSubmitAnswer = useCallback(() => {
    if (!answerText.trim()) return toast.error('Write something first');
    addAnswerMutation.mutate();
  }, [answerText, addAnswerMutation]);

  const sortedAnswers = question?.answers
    ? [...question.answers].sort((a, b) => {
        if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1;
        return b.votes - a.votes;
      })
    : [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse h-24 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        <div className="animate-pulse h-16 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        <div className="animate-pulse h-16 rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-[#8B0000] hover:text-[#6b0000] transition-colors"
      >
        <ArrowLeft size={16} /> Back to Questions
      </button>

      {/* Question card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-start gap-2 mb-3 flex-wrap">
          <h2 className="font-bold text-base text-gray-900 dark:text-white flex-1">{question.title}</h2>
          {question.isSolved && (
            <span className="flex items-center gap-0.5 text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950 px-2 py-0.5 rounded-full">
              <CheckCircle size={11} /> Solved
            </span>
          )}
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4 whitespace-pre-wrap">
          {question.content}
        </p>
        {question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {question.tags.map((t) => <TagChip key={t} tag={t} />)}
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-3">
          <div className="w-5 h-5 rounded-full bg-[#8B0000] flex items-center justify-center">
            <span className="text-[9px] font-bold text-white">{initials(question.author)}</span>
          </div>
          <span>{displayName(question.author)}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}</span>
          <span>·</span>
          <span className="flex items-center gap-0.5"><Eye size={11} /> {question.views}</span>
        </div>
      </div>

      {/* Answers */}
      <div>
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">
          {sortedAnswers.length} Answer{sortedAnswers.length !== 1 ? 's' : ''}
        </p>
        {sortedAnswers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No answers yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {sortedAnswers.map((answer) => (
              <AnswerCard
                key={answer.id}
                answer={answer}
                questionId={questionId}
                questionAuthorUsername={question.author.username}
                currentUsername={currentUsername}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add answer */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">Your Answer</p>
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          rows={4}
          placeholder="Share your knowledge with the Husky community..."
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#8B0000] resize-none"
        />
        <button
          onClick={handleSubmitAnswer}
          disabled={addAnswerMutation.isPending || !answerText.trim()}
          className="mt-3 px-5 py-2.5 bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
        >
          {addAnswerMutation.isPending ? 'Posting…' : 'Post Answer'}
        </button>
      </div>
    </div>
  );
}

function AskQuestionModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags]       = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const addTag = useCallback((raw: string) => {
    const trimmed = raw.trim().replace(/,+$/, '');
    if (trimmed && !tags.includes(trimmed) && tags.length < 8) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  }, [tags]);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(tagInput);
      } else if (e.key === 'Backspace' && !tagInput) {
        setTags((prev) => prev.slice(0, -1));
      }
    },
    [tagInput, addTag],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/qa', { title: title.trim(), content: content.trim(), tags });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qa'] });
      toast.success('Question posted!');
      onClose();
    },
    onError: () => toast.error('Failed to post question'),
  });

  const handleSubmit = useCallback(() => {
    if (!title.trim()) return toast.error('Title is required');
    if (!content.trim()) return toast.error('Details are required');
    createMutation.mutate();
  }, [title, content, createMutation]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-bold text-base text-gray-900 dark:text-white">Ask a Question</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your question? Be specific."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#8B0000]"
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Details
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Describe your question in detail. Include any relevant context..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#8B0000] resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
              Tags (press Enter or comma to add)
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus-within:border-[#8B0000] min-h-[42px]">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-0.5 bg-red-50 dark:bg-red-950 text-[#8B0000] text-xs font-semibold rounded-full"
                >
                  {tag}
                  <button onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}>
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => tagInput.trim() && addTag(tagInput)}
                placeholder={tags.length === 0 ? 'e.g. courses, housing, visa' : ''}
                className="flex-1 min-w-[120px] bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="w-full py-2.5 bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {createMutation.isPending ? 'Posting…' : 'Post Question'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function QAPage() {
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [showAsk, setShowAsk]         = useState(false);
  const [filterTab, setFilterTab]     = useState<FilterTab>('all');
  const [sortKey, setSortKey]         = useState<SortKey>('newest');

  const fetchQuestions = useCallback(async (): Promise<Question[]> => {
    const res = await api.get('/qa');
    return res.data;
  }, []);

  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ['qa'],
    queryFn: fetchQuestions,
    onError: () => toast.error('Failed to load questions'),
  } as any);

  const filtered = applySort(applyFilter(questions, filterTab), sortKey);

  if (selectedId) {
    return (
      <div className="pb-8">
        <QuestionDetail
          questionId={selectedId}
          onBack={() => setSelectedId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HelpCircle size={22} className="text-[#8B0000]" />
          <h1 className="font-bold text-2xl text-gray-900 dark:text-white">Q&amp;A</h1>
        </div>
        <button
          onClick={() => setShowAsk(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#8B0000] hover:bg-[#6b0000] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={15} /> Ask Question
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {(['all', 'unanswered', 'solved'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`flex-1 py-1.5 text-sm font-semibold rounded-lg capitalize transition-colors ${
              filterTab === tab
                ? 'bg-white dark:bg-gray-900 text-[#8B0000] shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'unanswered' ? 'Unanswered' : tab === 'solved' ? 'Solved' : 'All'}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium">Sort:</span>
        {(['newest', 'most-answered', 'most-viewed'] as SortKey[]).map((s) => (
          <button
            key={s}
            onClick={() => setSortKey(s)}
            className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${
              sortKey === s
                ? 'bg-[#8B0000] text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {s === 'newest' ? 'Newest' : s === 'most-answered' ? 'Most Answered' : 'Most Viewed'}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <QuestionSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <HelpCircle size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
          <p className="font-medium text-gray-700 dark:text-gray-300">No questions yet — be the first to ask!</p>
          <p className="text-sm text-gray-400 mt-1">Help your fellow Huskies by asking or answering questions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <QuestionRow
              key={q.id}
              question={q}
              onClick={() => setSelectedId(q.id)}
            />
          ))}
        </div>
      )}

      {/* Ask modal */}
      {showAsk && <AskQuestionModal onClose={() => setShowAsk(false)} />}
    </div>
  );
}
