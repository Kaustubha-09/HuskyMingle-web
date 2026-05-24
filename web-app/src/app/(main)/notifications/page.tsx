'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import {
  UserPlus,
  Heart,
  MessageCircle,
  Trophy,
  Calendar,
  Briefcase,
  Bell,
  BellOff,
} from 'lucide-react';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  type:
    | 'FOLLOW'
    | 'LIKE'
    | 'COMMENT'
    | 'MENTION'
    | 'MESSAGE'
    | 'GROUP_INVITE'
    | 'COMMUNITY_INVITE'
    | 'EVENT_INVITE'
    | 'JOB_MATCH'
    | 'ACHIEVEMENT'
    | 'SYSTEM';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  sender?: { username: string; profile?: { name: string; avatar?: string } };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'FOLLOW':
      return <UserPlus className="w-5 h-5" />;
    case 'LIKE':
      return <Heart className="w-5 h-5" />;
    case 'COMMENT':
    case 'MENTION':
    case 'MESSAGE':
    case 'GROUP_INVITE':
    case 'COMMUNITY_INVITE':
      return <MessageCircle className="w-5 h-5" />;
    case 'ACHIEVEMENT':
      return <Trophy className="w-5 h-5" />;
    case 'EVENT_INVITE':
      return <Calendar className="w-5 h-5" />;
    case 'JOB_MATCH':
      return <Briefcase className="w-5 h-5" />;
    case 'SYSTEM':
    default:
      return <Bell className="w-5 h-5" />;
  }
}

function getIconStyle(type: Notification['type']): string {
  switch (type) {
    case 'FOLLOW':
      return 'text-blue-500 bg-blue-50 dark:bg-blue-900/30';
    case 'LIKE':
      return 'text-pink-500 bg-pink-50 dark:bg-pink-900/30';
    case 'COMMENT':
    case 'MENTION':
      return 'text-green-500 bg-green-50 dark:bg-green-900/30';
    case 'MESSAGE':
    case 'GROUP_INVITE':
    case 'COMMUNITY_INVITE':
      return 'text-purple-500 bg-purple-50 dark:bg-purple-900/30';
    case 'ACHIEVEMENT':
      return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30';
    case 'EVENT_INVITE':
      return 'text-orange-500 bg-orange-50 dark:bg-orange-900/30';
    case 'JOB_MATCH':
      return 'text-teal-500 bg-teal-50 dark:bg-teal-900/30';
    default:
      return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
  }
}

function groupNotifications(
  notifications: Notification[],
): { label: string; items: Notification[] }[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const today: Notification[] = [];
  const thisWeek: Notification[] = [];
  const earlier: Notification[] = [];

  for (const n of notifications) {
    const d = new Date(n.createdAt);
    if (d >= todayStart) today.push(n);
    else if (d >= weekStart) thisWeek.push(n);
    else earlier.push(n);
  }

  return [
    { label: 'Today', items: today },
    { label: 'This Week', items: thisWeek },
    { label: 'Earlier', items: earlier },
  ].filter((g) => g.items.length > 0);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <BellOff className="w-14 h-14 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        You're all caught up
      </h3>
      <p className="text-sm text-gray-500 mt-1">No new notifications right now.</p>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
}) {
  const iconStyle = getIconStyle(notification.type);

  const handleClick = () => {
    if (!notification.read) onMarkRead(notification.id);
  };

  return (
    <div
      onClick={handleClick}
      className={[
        'flex items-start gap-3 p-4 transition-colors border-l-4',
        notification.read
          ? 'border-transparent cursor-default'
          : 'border-[#8B0000] bg-red-50/60 dark:bg-red-950/20 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30',
      ].join(' ')}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconStyle}`}
      >
        {getNotificationIcon(notification.type)}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
          {notification.title}
        </p>
        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-[#8B0000] shrink-0 mt-2" />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => api.get('/notifications/unread-count').then((r) => r.data),
  });

  const unreadCount = unreadData?.count ?? 0;

  const markOneRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const prev = queryClient.getQueryData<Notification[]>(['notifications']);
      queryClient.setQueryData<Notification[]>(['notifications'], (old = []) =>
        old.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      queryClient.setQueryData<{ count: number }>(['notifications', 'unread-count'], (old) =>
        old ? { count: Math.max(0, old.count - 1) } : { count: 0 },
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['notifications'], ctx.prev);
      toast.error('Failed to mark as read');
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(['notifications'], (old = []) =>
        old.map((n) => ({ ...n, read: true })),
      );
      queryClient.setQueryData(['notifications', 'unread-count'], { count: 0 });
      toast.success('All notifications marked as read');
    },
    onError: () => toast.error('Failed to mark all as read'),
  });

  const groups = groupNotifications(notifications);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-sm font-medium text-[#8B0000] hover:text-[#6b0000] disabled:opacity-50 transition-colors"
          >
            {markAllRead.isPending ? 'Marking...' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: 6 }).map((_, i) => (
              <NotificationSkeleton key={i} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            {groups.map((group) => (
              <div key={group.label}>
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {group.label}
                  </span>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {group.items.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onMarkRead={(id) => markOneRead.mutate(id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
