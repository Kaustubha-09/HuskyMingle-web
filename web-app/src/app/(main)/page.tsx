'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { CreatePost } from '@/components/posts/CreatePost';
import { PostCard } from '@/components/posts/PostCard';
import { StoriesBar } from '@/components/stories/StoriesBar';
import api from '@/lib/api';
import { format, isPast, differenceInHours } from 'date-fns';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MyDayData {
  greeting: string;
  dateLabel: string;
  weather: {
    temp: number;
    feelsLike: number;
    description: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    city: string;
  };
  todayEvents: Array<{
    id: string;
    title: string;
    startDate: string;
    location?: string;
    isNuOfficial: boolean;
    isVirtual: boolean;
  }>;
  unreadMessages: number;
  unreadNotifications: number;
  upcomingRsvps: Array<{
    event: { id: string; title: string; startDate: string; location?: string; isNuOfficial: boolean };
  }>;
  nuResources: Array<{ label: string; icon: string; url: string }>;
  canvas: {
    connected: boolean;
    courses: Array<{ id: number; name: string; course_code: string }>;
    assignments: Array<{
      id: number;
      name: string;
      due_at: string | null;
      points_possible: number | null;
      course_name?: string;
      course_code?: string;
      html_url: string;
    }>;
  };
}

// ── My Day Banner ─────────────────────────────────────────────────────────────

function MyDayBanner({ data, name }: { data: MyDayData; name: string }) {
  const firstName = name?.split(' ')[0] ?? 'Husky';

  return (
    <div className="bg-gradient-to-br from-[#8B0000] to-[#5a0000] rounded-2xl p-5 text-white mb-4 shadow-lg">
      {/* Greeting + date */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-red-200 text-xs font-medium uppercase tracking-wider mb-0.5">{data.dateLabel}</p>
          <h2 className="text-xl font-bold">{data.greeting}, {firstName} 👋</h2>
        </div>
        {/* Weather */}
        <div className="text-right">
          <div className="text-3xl leading-none">{data.weather.icon}</div>
          <div className="text-lg font-bold mt-0.5">{data.weather.temp}°F</div>
          <div className="text-red-200 text-xs">{data.weather.city}</div>
        </div>
      </div>

      {/* Weather detail */}
      <div className="flex items-center gap-4 text-xs text-red-200 mb-4">
        <span className="capitalize">{data.weather.description}</span>
        <span>·</span>
        <span>Feels {data.weather.feelsLike}°F</span>
        <span>·</span>
        <span>💧 {data.weather.humidity}%</span>
        <span>·</span>
        <span>💨 {data.weather.windSpeed} mph</span>
      </div>

      {/* Unread badges */}
      {(data.unreadMessages > 0 || data.unreadNotifications > 0) && (
        <div className="flex gap-2 mb-4">
          {data.unreadMessages > 0 && (
            <Link href="/messages" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-full px-3 py-1.5 text-xs font-medium transition-colors">
              💬 {data.unreadMessages} unread message{data.unreadMessages !== 1 ? 's' : ''}
            </Link>
          )}
          {data.unreadNotifications > 0 && (
            <Link href="/notifications" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-full px-3 py-1.5 text-xs font-medium transition-colors">
              🔔 {data.unreadNotifications} notification{data.unreadNotifications !== 1 ? 's' : ''}
            </Link>
          )}
        </div>
      )}

      {/* Today's events */}
      {data.todayEvents.length > 0 && (
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-xs font-semibold text-red-200 uppercase tracking-wider mb-2">Today on campus</p>
          <div className="space-y-1.5">
            {data.todayEvents.map(e => (
              <Link key={e.id} href="/events" className="flex items-center gap-2 text-sm hover:bg-white/10 rounded-lg px-2 py-1 -mx-2 transition-colors">
                <span>{e.isNuOfficial ? '🐾' : '📅'}</span>
                <span className="flex-1 truncate font-medium">{e.title}</span>
                <span className="text-red-200 text-xs flex-shrink-0">{format(new Date(e.startDate), 'h:mm a')}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming RSVPs */}
      {data.upcomingRsvps.length > 0 && data.todayEvents.length === 0 && (
        <div className="bg-white/10 rounded-xl p-3">
          <p className="text-xs font-semibold text-red-200 uppercase tracking-wider mb-2">Your upcoming events</p>
          <div className="space-y-1.5">
            {data.upcomingRsvps.map(({ event: e }) => (
              <Link key={e.id} href="/events" className="flex items-center gap-2 text-sm hover:bg-white/10 rounded-lg px-2 py-1 -mx-2 transition-colors">
                <span>{e.isNuOfficial ? '🐾' : '📅'}</span>
                <span className="flex-1 truncate font-medium">{e.title}</span>
                <span className="text-red-200 text-xs flex-shrink-0">{format(new Date(e.startDate), 'MMM d')}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── NU Resources Grid ─────────────────────────────────────────────────────────

function NuResourcesGrid({ resources }: { resources: Array<{ label: string; icon: string; url: string }> }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">NU Quick Links</p>
      <div className="grid grid-cols-5 gap-2">
        {resources.map(({ label, icon, url }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
            <span className="text-xs text-center text-gray-600 dark:text-gray-400 leading-tight font-medium">{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Canvas Widget ─────────────────────────────────────────────────────────────

function CanvasWidget({ canvas }: { canvas: MyDayData['canvas'] }) {
  if (!canvas.connected) {
    return (
      <Link
        href="/settings"
        className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-[#8B0000] transition-colors mb-4 group"
      >
        <span className="text-2xl">📚</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Connect Canvas LMS</p>
          <p className="text-xs text-gray-500">See your courses and assignments here</p>
        </div>
        <span className="text-xs text-[#8B0000] font-semibold group-hover:underline">Connect →</span>
      </Link>
    );
  }

  const now = new Date();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <span>📚</span> Canvas
        </p>
        <a
          href="https://northeastern.instructure.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#8B0000] hover:underline font-medium"
        >
          Open Canvas ↗
        </a>
      </div>

      {/* Courses row */}
      {canvas.courses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          {canvas.courses.map(c => (
            <span
              key={c.id}
              className="flex-shrink-0 px-3 py-1.5 bg-red-50 dark:bg-red-950 text-[#8B0000] rounded-full text-xs font-semibold"
            >
              {c.course_code || c.name.split(' ').slice(0, 3).join(' ')}
            </span>
          ))}
        </div>
      )}

      {/* Assignments */}
      {canvas.assignments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-2">No assignments due in the next 2 weeks 🎉</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">Upcoming assignments</p>
          {canvas.assignments.slice(0, 5).map(a => {
            const due = a.due_at ? new Date(a.due_at) : null;
            const hoursLeft = due ? differenceInHours(due, now) : null;
            const urgent = hoursLeft !== null && hoursLeft < 48;

            return (
              <a
                key={a.id}
                href={a.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl p-2 -mx-2 transition-colors"
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${urgent ? 'bg-red-500' : 'bg-blue-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-xs text-gray-500">
                    {a.course_code ?? a.course_name}
                    {due && (
                      <>
                        {' · '}
                        <span className={urgent ? 'text-red-500 font-semibold' : ''}>
                          Due {format(due, 'MMM d, h:mm a')}
                        </span>
                      </>
                    )}
                    {a.points_possible != null && ` · ${a.points_possible} pts`}
                  </p>
                </div>
              </a>
            );
          })}
          {canvas.assignments.length > 5 && (
            <a
              href="https://northeastern.instructure.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#8B0000] hover:underline font-medium block text-center pt-1"
            >
              +{canvas.assignments.length - 5} more on Canvas
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { user } = useAuthStore();

  const { data: myDay } = useQuery<MyDayData>({
    queryKey: ['my-day'],
    queryFn: async () => {
      const res = await api.get('/dashboard/my-day');
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }) => {
      const res = await api.get('/posts/feed', { params: { cursor: pageParam, limit: 20 } });
      return res.data;
    },
    getNextPageParam: (lastPage) => lastPage?.[lastPage.length - 1]?.id,
    initialPageParam: undefined,
  });

  const posts = data?.pages.flatMap((p) => p) ?? [];
  const userName = user?.profile?.name ?? user?.username ?? 'Husky';

  return (
    <div className="space-y-4">
      {/* My Day Banner */}
      {myDay && <MyDayBanner data={myDay} name={userName} />}

      {/* NU Quick Links */}
      {myDay && <NuResourcesGrid resources={myDay.nuResources} />}

      {/* Canvas widget */}
      {myDay && <CanvasWidget canvas={myDay.canvas} />}

      <StoriesBar />
      <CreatePost />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 animate-pulse">
              <div className="flex gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg font-medium">Your feed is empty</p>
          <p className="text-sm mt-1">Follow people or join communities to see posts here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => <PostCard key={post.id} post={post} />)}
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              className="w-full py-3 text-sm text-[#8B0000] hover:bg-red-50 rounded-xl font-medium"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
