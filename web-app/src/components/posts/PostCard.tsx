'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { Post } from '@/types/post';

interface PostCardProps {
  post: Post;
  onLikeChange?: (postId: string, liked: boolean, count: number) => void;
}

export function PostCard({ post, onLikeChange }: PostCardProps) {
  const { user } = useAuthStore();
  const [liked, setLiked] = useState((post.reactions?.length ?? 0) > 0);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);

  const handleLike = async () => {
    const nextLiked = !liked;
    const nextCount = nextLiked ? likeCount + 1 : likeCount - 1;
    // Optimistic update
    setLiked(nextLiked);
    setLikeCount(nextCount);
    try {
      await api.post(`/posts/${post.id}/react`, { type: 'LIKE' });
      onLikeChange?.(post.id, nextLiked, nextCount);
    } catch (err) {
      // Revert on failure
      setLiked(!nextLiked);
      setLikeCount(likeCount);
      console.error('[PostCard] like failed:', err);
    }
  };

  const name = post.author?.profile?.name || post.author?.username;
  const avatar = post.author?.profile?.avatar;
  const university = post.author?.profile?.university;

  return (
    <article className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link href={`/profile/${post.author?.username}`} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#8B0000] flex items-center justify-center text-white font-bold text-sm overflow-hidden">
            {avatar
              ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
              : name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">{name}</p>
            <p className="text-xs text-gray-500">
              {university && `${university} · `}
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </Link>
        <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {post.title && <h3 className="font-bold text-base mb-1">{post.title}</h3>}
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
          {post.content}
        </p>
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {post.hashtags.map((tag) => (
              <span key={tag} className="text-xs text-[#8B0000] hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div className={`grid gap-1 ${post.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.mediaUrls.slice(0, 4).map((url, i) => (
            <img key={i} src={url} alt="" className="w-full aspect-square object-cover" />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            liked
              ? 'text-red-500 bg-red-50 dark:bg-red-950'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        <Link
          href={`/posts/${post.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium"
        >
          <MessageCircle size={16} />
          {(post._count?.comments ?? 0) > 0 && <span>{post._count?.comments}</span>}
        </Link>

        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
          <Share2 size={16} />
        </button>

        <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium">
          <Bookmark size={16} />
        </button>
      </div>
    </article>
  );
}
