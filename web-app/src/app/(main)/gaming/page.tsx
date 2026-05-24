'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Trophy, Star, Lock, Users } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt: string;
}

interface UserProfileData {
  username: string;
  profile?: { name: string; avatar?: string };
  gamingPoints?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

const TIER_CONFIG: Record<
  Tier,
  { min: number; max: number; hex: string; bgClass: string; textClass: string }
> = {
  Bronze:   { min: 0,    max: 199,       hex: '#CD7F32', bgClass: 'bg-[#CD7F32]/10',  textClass: 'text-[#CD7F32]'  },
  Silver:   { min: 200,  max: 499,       hex: '#C0C0C0', bgClass: 'bg-gray-200',       textClass: 'text-gray-500'   },
  Gold:     { min: 500,  max: 999,       hex: '#FFD700', bgClass: 'bg-yellow-100',     textClass: 'text-yellow-600' },
  Platinum: { min: 1000, max: Infinity,  hex: '#E5E4E2', bgClass: 'bg-slate-100',      textClass: 'text-slate-500'  },
};

const TIER_ORDER: Tier[] = ['Bronze', 'Silver', 'Gold', 'Platinum'];

function getTier(points: number): Tier {
  if (points >= 1000) return 'Platinum';
  if (points >= 500)  return 'Gold';
  if (points >= 200)  return 'Silver';
  return 'Bronze';
}

function getProgress(points: number) {
  const tier = getTier(points);
  const conf = TIER_CONFIG[tier];
  if (tier === 'Platinum') return { pct: 100, nextTier: null, pointsNeeded: 0 };
  const range = conf.max + 1 - conf.min;
  const pct   = Math.min(100, Math.round(((points - conf.min) / range) * 100));
  const nextTier = TIER_ORDER[TIER_ORDER.indexOf(tier) + 1];
  return { pct, nextTier, pointsNeeded: conf.max + 1 - points };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const LOCKED_COUNT = 8;

const MOCK_LEADERBOARD = [
  { rank: 1,  name: 'Alex Chen',     username: 'alex.chen',  points: 1420, tier: 'Platinum' as Tier },
  { rank: 2,  name: 'Priya Sharma',  username: 'priya.s',    points: 1185, tier: 'Platinum' as Tier },
  { rank: 3,  name: 'Marcus Webb',   username: 'marcusw',    points: 980,  tier: 'Gold'     as Tier },
  { rank: 4,  name: 'Sofia Reyes',   username: 'sofia.r',    points: 752,  tier: 'Gold'     as Tier },
  { rank: 5,  name: 'James Park',    username: 'jpark',      points: 630,  tier: 'Gold'     as Tier },
  { rank: 6,  name: 'Emma Liu',      username: 'emmaliu',    points: 445,  tier: 'Silver'   as Tier },
  { rank: 7,  name: 'Diego Torres',  username: 'diego.t',    points: 310,  tier: 'Silver'   as Tier },
  { rank: 8,  name: 'Aisha Okafor',  username: 'aisha.o',    points: 245,  tier: 'Silver'   as Tier },
  { rank: 9,  name: 'Ryan Murphy',   username: 'ryanm',      points: 180,  tier: 'Bronze'   as Tier },
  { rank: 10, name: 'Zoe Anderson',  username: 'zoe.a',      points: 95,   tier: 'Bronze'   as Tier },
];

const TOP3_MEDALS = ['🥇', '🥈', '🥉'];

// ── Sub-components ────────────────────────────────────────────────────────────

function HeroSection({ points }: { points: number }) {
  const tier   = getTier(points);
  const conf   = TIER_CONFIG[tier];
  const { pct, nextTier, pointsNeeded } = getProgress(points);

  return (
    <div className="bg-gradient-to-br from-[#8B0000] to-[#5a0000] rounded-2xl p-6 text-white">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-red-200 text-xs font-medium uppercase tracking-wider mb-1">Your Score</p>
          <p className="text-4xl font-bold leading-none">{points.toLocaleString()}</p>
          <p className="text-red-200 text-sm mt-1">total points</p>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${conf.bgClass}`}>
          <Trophy size={14} style={{ color: conf.hex }} />
          <span className={`text-sm font-bold ${conf.textClass}`}>{tier}</span>
        </div>
      </div>

      {nextTier ? (
        <div>
          <div className="flex justify-between text-xs text-red-200 mb-1.5">
            <span>{tier}</span>
            <span>{nextTier} — {pointsNeeded} pts away</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: conf.hex }}
            />
          </div>
        </div>
      ) : (
        <p className="text-red-200 text-sm">You've reached the highest tier. Legendary! 🏆</p>
      )}

      <p className="text-red-200/80 text-xs mt-4 leading-relaxed">
        Earn points by posting, attending events, helping classmates, and connecting with Huskies
      </p>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-3xl leading-none">{achievement.icon}</span>
        <span className="text-xs font-bold text-[#8B0000] bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-full">
          +{achievement.points} pts
        </span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-900 dark:text-white">{achievement.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{achievement.description}</p>
      </div>
      <p className="text-xs text-gray-400">Unlocked {fmtDate(achievement.unlockedAt)}</p>
    </div>
  );
}

function LockedCard() {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3 opacity-60">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <Lock size={16} className="text-gray-400" />
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          ??? pts
        </span>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-400">???</p>
        <p className="text-xs text-gray-400 mt-0.5">Keep exploring to unlock</p>
      </div>
    </div>
  );
}

function AchievementsGrid({
  achievements,
  isLoading,
}: {
  achievements: Achievement[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse h-24 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {achievements.map((a) => (
        <AchievementCard key={a.id} achievement={a} />
      ))}
      {Array.from({ length: LOCKED_COUNT }).map((_, i) => (
        <LockedCard key={`locked-${i}`} />
      ))}
    </div>
  );
}

function LeaderboardTab() {
  return (
    <div className="space-y-2">
      {MOCK_LEADERBOARD.map((entry) => {
        const conf    = TIER_CONFIG[entry.tier];
        const initials = entry.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
        const medal   = entry.rank <= 3 ? TOP3_MEDALS[entry.rank - 1] : null;

        return (
          <div
            key={entry.rank}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3"
          >
            <span className="w-7 text-center text-sm flex-shrink-0">
              {medal ?? <span className="text-gray-400 font-medium">{entry.rank}</span>}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#8B0000] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{entry.name}</p>
              <p className="text-xs text-gray-400">@{entry.username}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {entry.points.toLocaleString()}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${conf.bgClass} ${conf.textClass}`}>
                {entry.tier}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GamingPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'achievements' | 'leaderboard'>('achievements');

  const fetchAchievements = useCallback(async (): Promise<Achievement[]> => {
    const res = await api.get('/gaming');
    return res.data;
  }, []);

  const fetchProfile = useCallback(async (): Promise<UserProfileData> => {
    const res = await api.get(`/users/${user!.username}`);
    return res.data;
  }, [user]);

  const { data: achievements = [], isLoading } = useQuery<Achievement[]>({
    queryKey: ['gaming', 'achievements'],
    queryFn: fetchAchievements,
    onError: () => toast.error('Failed to load achievements'),
  } as any);

  const { data: profile } = useQuery<UserProfileData>({
    queryKey: ['profile', user?.username],
    queryFn: fetchProfile,
    enabled: !!user?.username,
  });

  const totalPoints: number =
    (profile as any)?.gamingPoints ??
    achievements.reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy size={22} className="text-[#8B0000]" />
        <h1 className="font-bold text-2xl text-gray-900 dark:text-white">Gaming &amp; Achievements</h1>
      </div>

      {/* Hero */}
      <HeroSection points={totalPoints} />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {(['achievements', 'leaderboard'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-900 text-[#8B0000] shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'achievements' ? (
              <span className="flex items-center justify-center gap-1.5">
                <Star size={14} /> Achievements
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Users size={14} /> Leaderboard
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab body */}
      {activeTab === 'achievements' ? (
        <AchievementsGrid achievements={achievements} isLoading={isLoading} />
      ) : (
        <LeaderboardTab />
      )}
    </div>
  );
}
