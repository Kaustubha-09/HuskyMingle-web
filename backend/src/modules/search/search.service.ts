import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(q: string, limit = 20) {
    if (!q.trim()) return { users: [], events: [], jobs: [], posts: [] };

    const [users, events, jobs, posts] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: q, mode: 'insensitive' } },
            { profile: { name: { contains: q, mode: 'insensitive' } } },
            { profile: { major: { contains: q, mode: 'insensitive' } } },
          ],
        },
        include: { profile: { select: { name: true, avatar: true, major: true } } },
        take: limit,
      }),
      this.prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: { _count: { select: { attendees: true } } },
      }),
      (this.prisma as any).job.findMany({
        where: {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { company: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 10,
      }),
      this.prisma.post.findMany({
        where: {
          content: { contains: q, mode: 'insensitive' },
          visibility: 'PUBLIC',
        },
        take: 10,
        include: {
          author: { include: { profile: { select: { name: true, avatar: true } } } },
        },
      }),
    ]);

    return { users, events, jobs, posts };
  }
}
