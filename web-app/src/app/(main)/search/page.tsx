'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Search, Users, Briefcase, MapPin, Building2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  username: string;
  profile?: { name: string; avatar?: string; major?: string };
  _count: { followers: number; posts: number };
}

interface Event {
  id: string;
  title: string;
  startDate: string;
  location?: string;
  isNuOfficial: boolean;
  _count: { attendees: number };
}

interface Job {
  id: string;
  title: string;
  company: string;
  type: string;
  isRemote: boolean;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: { username: string; profile?: { name: string } };
}

interface SearchResults {
  users: User[];
  events: Event[];
  jobs: Job[];
  posts: Post[];
}

type Tab = 'All' | 'People' | 'Events' | 'Jobs' | 'Posts';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  return `Up to ${fmt(max!)}`;
}

function getJobTypeBadge(type: string): string {
  switch (type) {
    case 'INTERNSHIP':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    case 'RESEARCH':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    case 'FULL_TIME':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'PART_TIME':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

function getJobTypeLabel(type: string): string {
  return type.replace('_', '-').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function getInitials(name?: string, username?: string): string {
  if (name) return name.slice(0, 2).toUpperCase();
  if (username) return username.slice(0, 2).toUpperCase();
  return '??';
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SearchSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section Skeletons & Empty ─────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
        {count}
      </span>
    </div>
  );
}

// ─── People Section ───────────────────────────────────────────────────────────

function PeopleSection({ users }: { users: User[] }) {
  if (users.length === 0)
    return (
      <div className="text-center py-6 text-gray-500 text-sm">No people found</div>
    );

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <Link
          key={u.id}
          href={`/profile/${u.username}`}
          className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-[#8B0000]/40 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-[#8B0000] flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {getInitials(u.profile?.name, u.username)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {u.profile?.name ?? u.username}
            </p>
            <p className="text-xs text-gray-500 truncate">@{u.username}</p>
            {u.profile?.major && (
              <p className="text-xs text-gray-400 truncate">{u.profile.major}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {u._count.followers.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">followers</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Events Section ───────────────────────────────────────────────────────────

function EventsSection({ events }: { events: Event[] }) {
  if (events.length === 0)
    return <div className="text-center py-6 text-gray-500 text-sm">No events found</div>;

  return (
    <div className="space-y-2">
      {events.map((ev) => {
        const d = new Date(ev.startDate);
        return (
          <div
            key={ev.id}
            className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800"
          >
            {/* Date badge */}
            <div className="w-12 h-12 rounded-xl bg-[#8B0000]/10 dark:bg-[#8B0000]/20 flex flex-col items-center justify-center shrink-0">
              <span className="text-xs font-bold text-[#8B0000] uppercase leading-none">
                {d.toLocaleString('default', { month: 'short' })}
              </span>
              <span className="text-lg font-bold text-[#8B0000] leading-none">{d.getDate()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{ev.title}</p>
                {ev.isNuOfficial && (
                  <span className="text-xs bg-[#8B0000] text-white px-2 py-0.5 rounded-full font-medium">
                    NU Official
                  </span>
                )}
              </div>
              {ev.location && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {ev.location}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {ev._count.attendees.toLocaleString()} attending
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Jobs Section ─────────────────────────────────────────────────────────────

function JobsSection({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0)
    return <div className="text-center py-6 text-gray-500 text-sm">No jobs found</div>;

  return (
    <div className="space-y-2">
      {jobs.map((job) => {
        const salary = formatSalary(job.salaryMin, job.salaryMax);
        return (
          <div
            key={job.id}
            className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{job.title}</p>
                <p className="text-xs text-gray-500">{job.company}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${getJobTypeBadge(job.type)}`}
                  >
                    {getJobTypeLabel(job.type)}
                  </span>
                  {job.isRemote && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                      Remote
                    </span>
                  )}
                  {job.location && !job.isRemote && (
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                    </span>
                  )}
                  {salary && (
                    <span className="text-xs text-gray-500">{salary}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Posts Section ────────────────────────────────────────────────────────────

function PostsSection({ posts }: { posts: Post[] }) {
  if (posts.length === 0)
    return <div className="text-center py-6 text-gray-500 text-sm">No posts found</div>;

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <div
          key={post.id}
          className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#8B0000] flex items-center justify-center text-white text-xs font-semibold shrink-0">
              {getInitials(post.author.profile?.name, post.author.username)}
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {post.author.profile?.name ?? post.author.username}
            </span>
            <span className="text-xs text-gray-400 ml-auto">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{post.content}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

function TabBar({
  active,
  counts,
  onChange,
}: {
  active: Tab;
  counts: Record<Tab, number>;
  onChange: (t: Tab) => void;
}) {
  const tabs: Tab[] = ['All', 'People', 'Events', 'Jobs', 'Posts'];

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={[
            'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
            active === tab
              ? 'bg-[#8B0000] text-white'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-[#8B0000]/50',
          ].join(' ')}
        >
          {tab}
          {counts[tab] > 0 && (
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full ${
                active === tab
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}
            >
              {counts[tab]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Empty States ─────────────────────────────────────────────────────────────

function NoQueryState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Search className="w-14 h-14 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Search for anything...
      </h3>
      <p className="text-sm text-gray-500 mt-1">
        Find people, events, jobs, and posts across HuskyMingle.
      </p>
    </div>
  );
}

function NoResultsState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Search className="w-14 h-14 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No results found</h3>
      <p className="text-sm text-gray-500 mt-1">
        Nothing matched &ldquo;{query}&rdquo;. Try a different search.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue]);

  const { data, isLoading } = useQuery<SearchResults>({
    queryKey: ['search', debouncedQuery],
    queryFn: () => api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`).then((r) => r.data),
    enabled: debouncedQuery.length > 0,
  });

  const results: SearchResults = data ?? { users: [], events: [], jobs: [], posts: [] };
  const totalCount =
    results.users.length + results.events.length + results.jobs.length + results.posts.length;

  const counts: Record<Tab, number> = {
    All: totalCount,
    People: results.users.length,
    Events: results.events.length,
    Jobs: results.jobs.length,
    Posts: results.posts.length,
  };

  const showResults = debouncedQuery.length > 0 && !isLoading;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search people, events, jobs, posts..."
          className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/30 focus:border-[#8B0000] transition-colors text-sm"
        />
      </div>

      {/* Tab bar */}
      {debouncedQuery.length > 0 && (
        <TabBar active={activeTab} counts={counts} onChange={setActiveTab} />
      )}

      {/* Content */}
      {!debouncedQuery ? (
        <NoQueryState />
      ) : isLoading ? (
        <SearchSkeleton />
      ) : totalCount === 0 ? (
        <NoResultsState query={debouncedQuery} />
      ) : (
        <div className="space-y-6">
          {(activeTab === 'All' || activeTab === 'People') && results.users.length > 0 && (
            <section>
              <SectionHeader title="People" count={results.users.length} />
              <PeopleSection users={results.users} />
            </section>
          )}
          {(activeTab === 'All' || activeTab === 'Events') && results.events.length > 0 && (
            <section>
              <SectionHeader title="Events" count={results.events.length} />
              <EventsSection events={results.events} />
            </section>
          )}
          {(activeTab === 'All' || activeTab === 'Jobs') && results.jobs.length > 0 && (
            <section>
              <SectionHeader title="Jobs" count={results.jobs.length} />
              <JobsSection jobs={results.jobs} />
            </section>
          )}
          {(activeTab === 'All' || activeTab === 'Posts') && results.posts.length > 0 && (
            <section>
              <SectionHeader title="Posts" count={results.posts.length} />
              <PostsSection posts={results.posts} />
            </section>
          )}
          {/* Specific tab with no results in that category */}
          {activeTab !== 'All' && counts[activeTab] === 0 && (
            <NoResultsState query={debouncedQuery} />
          )}
        </div>
      )}
    </div>
  );
}
