'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// ── Canvas Connect Section ────────────────────────────────────────────────────

function CanvasSection() {
  const qc = useQueryClient();
  const [token, setToken] = useState('');
  const [showInput, setShowInput] = useState(false);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['canvas-dashboard'],
    queryFn: async () => {
      const res = await api.get('/canvas/dashboard');
      return res.data as { connected: boolean; courses: any[]; assignments: any[] };
    },
  });

  const save = useMutation({
    mutationFn: (t: string) => api.post('/canvas/token', { token: t }),
    onSuccess: () => {
      toast.success('Canvas connected!');
      setToken('');
      setShowInput(false);
      qc.invalidateQueries({ queryKey: ['canvas-dashboard'] });
      qc.invalidateQueries({ queryKey: ['my-day'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Invalid token'),
  });

  const remove = useMutation({
    mutationFn: () => api.delete('/canvas/token'),
    onSuccess: () => {
      toast.success('Canvas disconnected');
      qc.invalidateQueries({ queryKey: ['canvas-dashboard'] });
      qc.invalidateQueries({ queryKey: ['my-day'] });
    },
  });

  if (isLoading) return <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">📚</span>
        <div>
          <h3 className="font-semibold">Canvas LMS</h3>
          <p className="text-xs text-gray-500">northeastern.instructure.com</p>
        </div>
        <div className="ml-auto">
          {dashboard?.connected ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Connected
            </span>
          ) : (
            <span className="text-xs text-gray-400">Not connected</span>
          )}
        </div>
      </div>

      {dashboard?.connected ? (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {dashboard.courses.length} active course{dashboard.courses.length !== 1 ? 's' : ''} synced
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {dashboard.courses.slice(0, 5).map((c: any) => (
              <span key={c.id} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-medium">
                {c.course_code ?? c.name}
              </span>
            ))}
            {dashboard.courses.length > 5 && (
              <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-500">
                +{dashboard.courses.length - 5} more
              </span>
            )}
          </div>
          <button
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Disconnect Canvas
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Connect your Canvas account to see courses and upcoming assignments right in HuskyMingle.
          </p>

          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="px-4 py-2 bg-[#8B0000] text-white rounded-xl text-sm font-semibold hover:bg-[#6b0000] transition-colors"
            >
              Connect Canvas
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                <strong>How to get your token:</strong><br />
                1. Go to <a href="https://northeastern.instructure.com/profile/settings" target="_blank" rel="noopener noreferrer" className="underline">Canvas → Account → Settings</a><br />
                2. Scroll to <strong>Approved Integrations</strong> → <strong>+ New Access Token</strong><br />
                3. Set purpose to &quot;HuskyMingle&quot; and copy the token here
              </div>
              <input
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Paste your Canvas access token..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000]"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => save.mutate(token)}
                  disabled={!token.trim() || save.isPending}
                  className="px-4 py-2 bg-[#8B0000] text-white rounded-xl text-sm font-semibold hover:bg-[#6b0000] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {save.isPending && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save Token
                </button>
                <button
                  onClick={() => { setShowInput(false); setToken(''); }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Profile Section ───────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    bio: user?.profile?.bio ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/users/profile', form);
      updateUser({ profile: { ...(user?.profile as any), ...form } });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
      <h3 className="font-semibold mb-4 flex items-center gap-2"><span>👤</span> Profile</h3>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block mb-1.5">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Tell other Huskies about yourself..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B0000] resize-none"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#8B0000] text-white rounded-xl text-sm font-semibold hover:bg-[#6b0000] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-4">
        {/* Account info */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><span>🎓</span> Account</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Email</span>
              <span className="font-medium text-gray-900 dark:text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Username</span>
              <span className="font-medium text-gray-900 dark:text-white">@{user?.username}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>University</span>
              <span className="font-medium text-gray-900 dark:text-white">{user?.profile?.university ?? '—'}</span>
            </div>
          </div>
        </div>

        <ProfileSection />
        <CanvasSection />

        {/* Logout */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><span>🚪</span> Account Actions</h3>
          <button
            onClick={logout}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
