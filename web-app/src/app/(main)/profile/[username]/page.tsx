'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { use } from 'react';
import Link from 'next/link';
import { MapPin, Link as LinkIcon, UserPlus, UserMinus, MessageCircle, CircleDot } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCirclesStore } from '@/store/circles.store';
import { PostCard } from '@/components/posts/PostCard';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { user: currentUser } = useAuthStore();
  const circles = useCirclesStore(s => s.circles);
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => api.get(`/users/${username}`).then(r => r.data),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['userPosts', username],
    queryFn: () => api.get(`/posts/user/${username}`).then(r => r.data).catch(() => []),
    enabled: !!profile,
  });

  const followMutation = useMutation({
    mutationFn: () => api.post(`/users/${profile.id}/follow`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', username] });
      toast.success(profile.isFollowing ? 'Unfollowed' : 'Following!');
    },
  });

  if (isLoading) return <div className="animate-pulse space-y-4"><div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl" /><div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" /></div>;
  if (!profile) return <div className="text-center py-16 text-gray-500">User not found</div>;

  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="space-y-6">
      {/* Cover */}
      <div className="bg-gradient-to-r from-[#8B0000] to-[#4a0000] h-32 rounded-xl" />

      {/* Profile info */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 -mt-10 mx-2">
        <div className="flex items-end justify-between mb-4">
          <div className="w-20 h-20 rounded-full bg-[#8B0000] border-4 border-white dark:border-gray-900 flex items-center justify-center text-white text-2xl font-bold -mt-12 overflow-hidden">
            {profile.profile?.avatar ? <img src={profile.profile.avatar} alt="" className="w-full h-full object-cover" /> : profile.profile?.name?.[0] || profile.username[0].toUpperCase()}
          </div>
          <div className="flex gap-2">
            {!isOwnProfile && (
              <>
                <button onClick={() => followMutation.mutate()} disabled={followMutation.isPending} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-1.5 ${profile.isFollowing ? 'border border-gray-300 dark:border-gray-700 hover:border-red-300 hover:text-red-500' : 'bg-[#8B0000] text-white hover:bg-[#6b0000]'}`}>
                  {profile.isFollowing ? <><UserMinus size={14} /> Unfollow</> : <><UserPlus size={14} /> Follow</>}
                </button>
                <button className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-1.5">
                  <MessageCircle size={14} /> Message
                </button>
              </>
            )}
            {isOwnProfile && (
              <button className="px-4 py-2 rounded-full text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold">{profile.profile?.name || profile.username}</h1>
          <p className="text-gray-500 text-sm">@{profile.username}</p>

          {profile.profile?.bio && <p className="mt-3 text-sm leading-relaxed">{profile.profile.bio}</p>}

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
            {profile.profile?.university && <span className="flex items-center gap-1"><MapPin size={13} />{profile.profile.university}</span>}
            {profile.profile?.website && <span className="flex items-center gap-1"><LinkIcon size={13} />{profile.profile.website}</span>}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center"><p className="font-bold">{profile._count?.posts || 0}</p><p className="text-xs text-gray-500">Posts</p></div>
            <div className="text-center"><p className="font-bold">{profile.profile?.followersCount || 0}</p><p className="text-xs text-gray-500">Followers</p></div>
            <div className="text-center"><p className="font-bold">{profile.profile?.followingCount || 0}</p><p className="text-xs text-gray-500">Following</p></div>
          </div>

          {/* Skills & Languages */}
          {profile.profile?.skills?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.profile.skills.map((s: string) => <span key={s} className="px-2.5 py-1 bg-[#8B0000] bg-opacity-10 text-[#8B0000] rounded-full text-xs font-medium">{s}</span>)}
              </div>
            </div>
          )}

          {profile.profile?.interests?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.profile.interests.map((i: string) => <span key={i} className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">{i}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Circles — own profile only */}
      {isOwnProfile && (
        <Link
          href="/circles"
          className="flex items-center gap-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 px-5 py-4 hover:border-[#8B0000]/40 hover:shadow-sm transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-[#8B0000]/10 flex items-center justify-center flex-shrink-0">
            <CircleDot size={20} className="text-[#8B0000]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-white">Circles</p>
            <p className="text-sm text-gray-500">
              {circles.length === 0 ? 'Private groups' : `${circles.length} circle${circles.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <span className="text-gray-400 text-sm">→</span>
        </Link>
      )}

      {/* Posts */}
      <div className="space-y-4">
        <h2 className="font-bold text-lg">Posts</h2>
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No posts yet</div>
        ) : (
          posts.map((post: any) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
