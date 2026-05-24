import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface MatchScore {
  userId: string;
  score: number;
  breakdown: {
    interests: number;
    skills: number;
    languages: number;
    activity: number;
    sharedEvents: number;
  };
  sharedEventTitles: string[];
}

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Smart matching algorithm.
   * Scores: interests (35%) + complementary skills (25%) + language overlap (15%) + activity (5%) + shared events (20%)
   */
  async getRecommendations(userId: string, limit = 20): Promise<any[]> {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        following: true,
        attendees: { select: { eventId: true } },
      },
    });

    if (!currentUser?.profile) return [];

    const { interests, skills, languages } = currentUser.profile;
    const followingIds = currentUser.following.map(f => f.followingId);
    const myEventIds = new Set(currentUser.attendees.map(a => a.eventId));

    const candidates = await this.prisma.user.findMany({
      where: {
        id: { notIn: [userId, ...followingIds] },
        profile: { isNot: null },
      },
      include: {
        profile: true,
        posts: { orderBy: { createdAt: 'desc' }, take: 1 },
        attendees: {
          select: {
            eventId: true,
            event: { select: { title: true } },
          },
        },
      },
      take: 200,
    });

    const scored: MatchScore[] = candidates.map(candidate => {
      const p = candidate.profile!;

      const interestScore = this.jaccardSimilarity(interests, p.interests) * 35;

      const skillOverlap = this.jaccardSimilarity(skills, p.skills);
      const skillScore = (1 - skillOverlap * 0.5) * 25;

      const langScore = this.hasOverlap(languages, p.languages) ? 15 : 0;

      const lastPost = candidate.posts[0];
      const daysSinceActive = lastPost
        ? (Date.now() - lastPost.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        : 365;
      const activityScore = Math.max(0, 5 - daysSinceActive * 0.05);

      // Shared events (20%) — Jaccard on RSVPed event sets
      const theirEventIds = new Set(candidate.attendees.map(a => a.eventId));
      const sharedIds = [...myEventIds].filter(id => theirEventIds.has(id));
      const unionSize = myEventIds.size + theirEventIds.size - sharedIds.length;
      const eventScore = unionSize === 0 ? 0 : (sharedIds.length / unionSize) * 20;

      const sharedEventTitles = candidate.attendees
        .filter(a => myEventIds.has(a.eventId))
        .map(a => a.event?.title)
        .filter((t): t is string => Boolean(t))
        .slice(0, 3);

      const total = interestScore + skillScore + langScore + activityScore + eventScore;

      return {
        userId: candidate.id,
        score: Math.round(total),
        breakdown: {
          interests: Math.round(interestScore),
          skills: Math.round(skillScore),
          languages: langScore,
          activity: Math.round(activityScore),
          sharedEvents: Math.round(eventScore),
        },
        sharedEventTitles,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    const topIds = scored.slice(0, limit).map(s => s.userId);
    const topUsers = await this.prisma.user.findMany({
      where: { id: { in: topIds } },
      include: {
        profile: true,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });

    return topUsers.map(user => {
      const scoreData = scored.find(s => s.userId === user.id)!;
      const { password, refreshToken, ...safe } = user;
      return {
        ...safe,
        matchScore: scoreData.score,
        matchBreakdown: scoreData.breakdown,
        sharedEventTitles: scoreData.sharedEventTitles,
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }

  private jaccardSimilarity(a: string[], b: string[]): number {
    if (!a.length && !b.length) return 0;
    const setA = new Set(a.map(s => s.toLowerCase()));
    const setB = new Set(b.map(s => s.toLowerCase()));
    const intersection = [...setA].filter(x => setB.has(x)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
  }

  private hasOverlap(a: string[], b: string[]): boolean {
    const setA = new Set(a.map(s => s.toLowerCase()));
    return b.some(x => setA.has(x.toLowerCase()));
  }
}
