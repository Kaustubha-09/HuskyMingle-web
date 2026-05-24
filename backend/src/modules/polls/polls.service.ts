import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PollsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, cursor?: string, limit = 20) {
    const polls = await (this.prisma as any).poll.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        author: { include: { profile: { select: { name: true, avatar: true } } } },
        votes: { where: { userId }, select: { optionIndex: true } },
        _count: { select: { votes: true } },
      },
    });

    return polls.map((p: any) => ({
      ...p,
      userVote: p.votes[0]?.optionIndex ?? null,
      votes: undefined,
    }));
  }

  async vote(pollId: string, userId: string, optionIndex: number) {
    const poll = await (this.prisma as any).poll.findUnique({ where: { id: pollId } });
    if (!poll) throw new NotFoundException('Poll not found');

    const existing = await (this.prisma as any).pollVote.findUnique({
      where: { pollId_userId: { pollId, userId } },
    });
    if (existing) throw new BadRequestException('Already voted');

    await (this.prisma as any).pollVote.create({
      data: { pollId, userId, optionIndex },
    });
    await (this.prisma as any).poll.update({
      where: { id: pollId },
      data: { totalVotes: { increment: 1 } },
    });
    return { success: true };
  }

  async create(userId: string, data: any) {
    return (this.prisma as any).poll.create({ data: { ...data, authorId: userId } });
  }

  async remove(id: string) {
    await (this.prisma as any).poll.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
