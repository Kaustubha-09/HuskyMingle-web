'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { 'en-US': enUS },
});

interface NuEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  isVirtual: boolean;
  meetingUrl?: string;
  tags: string[];
  isNuOfficial: boolean;
  sourceUrl?: string;
  coverImage?: string;
  _count?: { attendees: number };
}

function useEvents(from: string, to: string) {
  return useQuery({
    queryKey: ['events', from, to],
    queryFn: async () => {
      const res = await api.get('/events', { params: { from, to, limit: 100 } });
      return res.data as NuEvent[];
    },
  });
}

function EventModal({ event, onClose }: { event: NuEvent; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const rsvp = useMutation({
    mutationFn: () => api.post(`/events/${event.id}/rsvp`),
    onSuccess: (res) => {
      toast.success(res.data.attending ? 'You\'re going!' : 'RSVP removed');
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const { data: friendsAttending = [] } = useQuery({
    queryKey: ['event-friends', event.id],
    queryFn: async () => {
      const res = await api.get(`/events/${event.id}/friends-attending`);
      return res.data as { user: { username: string; profile?: { name: string; avatar?: string } } }[];
    },
    enabled: Boolean(user),
  });

  const handleIcs = () => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
    window.open(`${base}/events/${event.id}/ics`, '_blank');
  };

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {event.coverImage && (
          <img src={event.coverImage} alt={event.title} className="w-full h-48 object-cover rounded-t-2xl" />
        )}
        <div className="p-6">
          {event.isNuOfficial && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-[#8B0000] text-xs font-semibold mb-3">
              🐾 Official NU Event
            </span>
          )}
          <h2 className="text-xl font-bold mb-3">{event.title}</h2>

          <div className="space-y-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{format(start, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🕐</span>
              <span>{format(start, 'h:mm a')} – {format(end, 'h:mm a')}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span>{event.location}</span>
              </div>
            )}
            {event.isVirtual && event.meetingUrl && (
              <div className="flex items-center gap-2">
                <span>💻</span>
                <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-[#8B0000] hover:underline">
                  Join Virtual Event
                </a>
              </div>
            )}
            {event._count && (
              <div className="flex items-center gap-2">
                <span>👥</span>
                <span>{event._count.attendees} attending</span>
              </div>
            )}
            {friendsAttending.length > 0 && (
              <div className="flex items-center gap-2">
                <span>🤝</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {friendsAttending.slice(0, 4).map((a, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full bg-[#8B0000] border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-[10px] font-bold"
                        title={a.user.profile?.name || a.user.username}
                      >
                        {(a.user.profile?.name || a.user.username)[0].toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-[#8B0000] font-medium">
                    {friendsAttending.length === 1
                      ? `${friendsAttending[0].user.profile?.name || friendsAttending[0].user.username} is going`
                      : `${friendsAttending.length} friends going`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {event.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            {event.description}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => rsvp.mutate()}
              disabled={rsvp.isPending}
              className="flex-1 py-2.5 bg-[#8B0000] text-white rounded-xl font-semibold text-sm hover:bg-[#6b0000] transition-colors disabled:opacity-50"
            >
              {rsvp.isPending ? 'Saving...' : 'RSVP'}
            </button>
            <button
              onClick={handleIcs}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title="Add to Calendar (.ics)"
            >
              📥 .ics
            </button>
            {event.sourceUrl && (
              <a
                href={event.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                NU Page ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type TagFilter = 'all' | 'nu' | 'meetups' | 'tech' | 'cultural';

const TAG_FILTERS: { key: TagFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'nu', label: '🐾 NU Official' },
  { key: 'meetups', label: 'Meetups' },
  { key: 'tech', label: 'Tech' },
  { key: 'cultural', label: 'Cultural' },
];

function matchesTag(event: NuEvent, filter: TagFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'nu') return event.isNuOfficial;
  const tags = event.tags.map(t => t.toLowerCase());
  const title = event.title.toLowerCase();
  if (filter === 'meetups') return tags.some(t => ['meetup', 'social', 'networking', 'mixer'].includes(t)) || title.includes('meetup') || title.includes('social');
  if (filter === 'tech') return tags.some(t => ['tech', 'technology', 'engineering', 'cs', 'coding', 'hackathon', 'software'].includes(t)) || title.includes('tech') || title.includes('hack');
  if (filter === 'cultural') return tags.some(t => ['cultural', 'culture', 'diversity', 'international', 'heritage'].includes(t)) || title.includes('cultural') || title.includes('culture');
  return true;
}

export default function EventsPage() {
  const [viewDate, setViewDate] = useState(new Date());
  const [view, setView] = useState<string>(Views.MONTH);
  const [selected, setSelected] = useState<NuEvent | null>(null);
  const [tagFilter, setTagFilter] = useState<TagFilter>('all');

  const from = startOfMonth(viewDate).toISOString();
  const to = endOfMonth(viewDate).toISOString();
  const { data: events = [], isLoading } = useEvents(from, to);

  const filteredEvents = events.filter(e => matchesTag(e, tagFilter));

  const calEvents = filteredEvents.map(e => ({
    id: e.id,
    title: (e.isNuOfficial ? '🐾 ' : '') + e.title,
    start: new Date(e.startDate),
    end: new Date(e.endDate),
    resource: e,
  }));

  const handleSelectEvent = useCallback((calEvent: any) => {
    setSelected(calEvent.resource as NuEvent);
  }, []);

  const handleNavigate = useCallback((date: Date) => {
    setViewDate(date);
  }, []);

  const nuCount = events.filter(e => e.isNuOfficial).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          {nuCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              🐾 {nuCount} official NU event{nuCount !== 1 ? 's' : ''} this month
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {(['month', 'week', 'agenda'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                view === v
                  ? 'bg-[#8B0000] text-white'
                  : 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:border-[#8B0000]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Tag filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {TAG_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setTagFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tagFilter === f.key
                ? 'bg-[#8B0000] text-white'
                : 'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-[#8B0000]'
            }`}
          >
            {f.label}
          </button>
        ))}
        {tagFilter !== 'all' && (
          <span className="text-xs text-gray-500 ml-1">{filteredEvents.length} events</span>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#8B0000] inline-block" />
          Official NU Event
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
          Student / Community Event
        </span>
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#8B0000] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Calendar
            localizer={localizer}
            events={calEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            view={view as any}
            onView={setView as any}
            date={viewDate}
            onNavigate={handleNavigate}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={(event: any) => ({
              style: {
                backgroundColor: event.resource?.isNuOfficial ? '#8B0000' : '#3B82F6',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
              },
            })}
            popup
          />
        )}
      </div>

      {/* Event list below calendar */}
      {filteredEvents.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Upcoming this month</h2>
          <div className="grid gap-3">
            {[...filteredEvents]
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .slice(0, 8)
              .map(e => (
                <button
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="flex items-start gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#8B0000] transition-colors text-left"
                >
                  <div className="text-center w-12 flex-shrink-0">
                    <div className="text-xs text-gray-500 uppercase">{format(new Date(e.startDate), 'MMM')}</div>
                    <div className="text-2xl font-bold text-[#8B0000]">{format(new Date(e.startDate), 'd')}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {e.isNuOfficial && <span className="text-xs bg-red-100 text-[#8B0000] px-2 py-0.5 rounded-full font-medium">🐾 NU</span>}
                      <span className="font-semibold text-sm truncate">{e.title}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(new Date(e.startDate), 'h:mm a')}
                      {e.location && ` · ${e.location}`}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
