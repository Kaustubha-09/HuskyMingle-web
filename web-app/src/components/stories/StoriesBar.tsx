'use client';

import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export function StoriesBar() {
  const { user } = useAuthStore();
  const { data: stories = [] } = useQuery({
    queryKey: ['stories'],
    queryFn: () => api.get('/stories').then(r => r.data),
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {/* Add story */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
          <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center group-hover:border-[#8B0000] transition-colors">
            <Plus size={20} className="text-gray-400 group-hover:text-[#8B0000]" />
          </div>
          <span className="text-xs text-gray-500">Your Story</span>
        </div>

        {/* Stories from feed */}
        {stories.map((story: any) => (
          <div key={story.id} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer">
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#8B0000] to-[#FFD700]">
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 p-0.5 overflow-hidden">
                {story.author?.profile?.avatar ? (
                  <img src={story.author.profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#8B0000] flex items-center justify-center text-white text-sm font-bold">
                    {story.author?.profile?.name?.[0] || '?'}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[56px] truncate">
              {story.author?.profile?.name?.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
