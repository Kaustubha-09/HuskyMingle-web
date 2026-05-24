'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  Home, Compass, MessageCircle, ShoppingBag, CalendarDays, Tv2, Briefcase,
  HelpCircle, BarChart2, Mic2, BookOpen, Trophy, Bell, Bookmark, Settings,
  LogOut, Users, Zap, CircleDot,
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/circles', label: 'Circles', icon: CircleDot },
  { href: '/reels', label: 'Reels', icon: Zap },
  { href: '/live', label: 'Live', icon: Tv2 },
  { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/qa', label: 'Q&A', icon: HelpCircle },
  { href: '/polls', label: 'Polls', icon: BarChart2 },
  { href: '/audio', label: 'Audio Rooms', icon: Mic2 },
  { href: '/courses', label: 'Courses', icon: BookOpen },
  { href: '/gaming', label: 'Gaming', icon: Trophy },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    window.location.href = '/login';
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-50 overflow-y-auto">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#8B0000] rounded-lg flex items-center justify-center">
            <span className="text-[#FFD700] font-bold text-sm">H</span>
          </div>
          <span className="font-bold text-xl text-[#8B0000]">HuskyMingle</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#8B0000] text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      {user && (
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800">
          <Link
            href={`/profile/${user.username}`}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <div className="w-8 h-8 rounded-full bg-[#8B0000] flex items-center justify-center text-white text-sm font-bold">
              {user.profile?.name?.[0] || user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.profile?.name || user.username}</p>
              <p className="text-xs text-gray-500 truncate">@{user.username}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="mt-1 flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      )}
    </aside>
  );
}
