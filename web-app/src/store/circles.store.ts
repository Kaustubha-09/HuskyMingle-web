import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HMCircle {
  id: string;
  name: string;
  emoji: string;
  memberHandles: string[];
  createdAt: string;
}

interface CirclesState {
  circles: HMCircle[];
  add: (name: string, emoji: string, memberHandles: string[]) => HMCircle;
  update: (circle: HMCircle) => void;
  remove: (id: string) => void;
  addMember: (circleId: string, handle: string) => void;
  removeMember: (circleId: string, handle: string) => void;
  byId: (id: string) => HMCircle | undefined;
}

export const useCirclesStore = create<CirclesState>()(
  persist(
    (set, get) => ({
      circles: [],

      add: (name, emoji, memberHandles) => {
        const circle: HMCircle = {
          id: crypto.randomUUID(),
          name,
          emoji,
          memberHandles,
          createdAt: new Date().toISOString(),
        };
        set(s => ({ circles: [circle, ...s.circles] }));
        return circle;
      },

      update: (circle) =>
        set(s => ({ circles: s.circles.map(c => (c.id === circle.id ? circle : c)) })),

      remove: (id) =>
        set(s => ({ circles: s.circles.filter(c => c.id !== id) })),

      addMember: (circleId, handle) =>
        set(s => ({
          circles: s.circles.map(c =>
            c.id === circleId && !c.memberHandles.includes(handle)
              ? { ...c, memberHandles: [...c.memberHandles, handle] }
              : c,
          ),
        })),

      removeMember: (circleId, handle) =>
        set(s => ({
          circles: s.circles.map(c =>
            c.id === circleId
              ? { ...c, memberHandles: c.memberHandles.filter(h => h !== handle) }
              : c,
          ),
        })),

      byId: (id) => get().circles.find(c => c.id === id),
    }),
    { name: 'hm_circles_v1' },
  ),
);
