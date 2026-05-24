'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { UserPlus, Zap, Calendar, BookOpen, Users } from 'lucide-react';

interface MatchUser {
  id: string;
  username: string;
  profile?: {
    name: string;
    avatar?: string;
    major?: string;
    university?: string;
    bio?: string;
    interests: string[];
    skills: string[];
  };
  matchScore: number;
  matchBreakdown: {
    interests: number;
    skills: number;
    languages: number;
    activity: number;
    sharedEvents: number;
  };
  sharedEventTitles: string[];
  _count: { followers: number; following: number; posts: number };
}

function ScoreBar({ value, max = 40, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex-1">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function MatchCard({ match, onFollow }: { match: MatchUser; onFollow: (id: string) => void }) {
  const sharedInterests = match.profile?.interests?.slice(0, 3) ?? [];
  const scoreColor =
    match.matchScore >= 60 ? 'text-green-600' :
    match.matchScore >= 35 ? 'text-yellow-600' :
    'text-gray-500';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex flex-col gap-4 hover:border-[#8B0000] transition-colors">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-[#8B0000] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {(match.profile?.name || match.username)[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{match.profile?.name || match.username}</p>
          <p className="text-xs text-gray-500">@{match.username}</p>
          {match.profile?.major && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">{match.profile.major}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`text-lg font-bold ${scoreColor}`}>{match.matchScore}%</span>
          <p className="text-[10px] text-gray-400">match</p>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="space-y-1.5 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-20 flex-shrink-0">Interests</span>
          <ScoreBar value={match.matchBreakdown.interests} max={35} color="bg-[#8B0000]" />
          <span className="w-6 text-right">{match.matchBreakdown.interests}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-20 flex-shrink-0">Skills</span>
          <ScoreBar value={match.matchBreakdown.skills} max={25} color="bg-blue-500" />
          <span className="w-6 text-right">{match.matchBreakdown.skills}</span>
        </div>
        {match.matchBreakdown.sharedEvents > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-20 flex-shrink-0">Events</span>
            <ScoreBar value={match.matchBreakdown.sharedEvents} max={20} color="bg-purple-500" />
            <span className="w-6 text-right">{match.matchBreakdown.sharedEvents}</span>
          </div>
        )}
      </div>

      {/* Shared interests */}
      {sharedInterests.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sharedInterests.map(interest => (
            <span key={interest} className="px-2 py-0.5 bg-red-50 dark:bg-red-950 text-[#8B0000] text-xs rounded-full font-medium">
              {interest}
            </span>
          ))}
        </div>
      )}

      {/* Shared events icebreaker */}
      {match.sharedEventTitles.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-3 flex items-start gap-2">
          <Calendar size={14} className="text-purple-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-0.5">Both going to:</p>
            <p className="text-xs text-purple-600 dark:text-purple-300 leading-relaxed">
              {match.sharedEventTitles.join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Bio */}
      {match.profile?.bio && (
        <p className="text-xs text-gray-500 line-clamp-2">{match.profile.bio}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => onFollow(match.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#8B0000] text-white rounded-xl text-sm font-semibold hover:bg-[#6b0000] transition-colors"
        >
          <UserPlus size={14} />
          Follow
        </button>
        <a
          href={`/profile/${match.username}`}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium hover:border-[#8B0000] transition-colors"
        >
          View
        </a>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['matching-recommendations'],
    queryFn: async () => {
      const res = await api.get('/matching/recommendations', { params: { limit: 30 } });
      return res.data as MatchUser[];
    },
  });

  const follow = useMutation({
    mutationFn: (userId: string) => api.post(`/users/${userId}/follow`),
    onSuccess: () => {
      toast.success('Following!');
      qc.invalidateQueries({ queryKey: ['matching-recommendations'] });
    },
    onError: () => toast.error('Could not follow'),
  });

  const filtered = matches.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.username.toLowerCase().includes(q) ||
      m.profile?.name?.toLowerCase().includes(q) ||
      m.profile?.major?.toLowerCase().includes(q) ||
      m.profile?.interests?.some(i => i.toLowerCase().includes(q))
    );
  });

  const withEvents = filtered.filter(m => m.sharedEventTitles.length > 0);
  const rest = filtered.filter(m => m.sharedEventTitles.length === 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Explore</h1>
        <p className="text-sm text-gray-500 mt-1">Huskies matched by shared interests, skills, and events</p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, major, or interest..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm mb-6 focus:outline-none focus:border-[#8B0000]"
      />

      {/* Stats bar */}
      {!isLoading && matches.length > 0 && (
        <div className="flex items-center gap-6 mb-6 text-sm text-gray-500">
          <span className="flex items-center gap-1.5"><Users size={14} /> {matches.length} suggested</span>
          <span className="flex items-center gap-1.5"><Calendar size={14} /> {withEvents.length} share events with you</span>
          <span className="flex items-center gap-1.5"><Zap size={14} /> {matches.filter(m => m.matchScore >= 60).length} high match</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[#8B0000] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No matches found</p>
          <p className="text-sm mt-1">Try updating your interests in settings</p>
        </div>
      ) : (
        <>
          {/* People going to same events — shown first */}
          {withEvents.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-purple-600" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Going to the same events as you</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {withEvents.map(m => (
                  <MatchCard key={m.id} match={m} onFollow={id => follow.mutate(id)} />
                ))}
              </div>
            </div>
          )}

          {/* Everyone else */}
          {rest.length > 0 && (
            <div>
              {withEvents.length > 0 && (
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Other Huskies you might like</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {rest.map(m => (
                  <MatchCard key={m.id} match={m} onFollow={id => follow.mutate(id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
