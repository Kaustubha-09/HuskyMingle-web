import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class QaService {
  constructor(private prisma: PrismaService) {}

  async findAll(cursor?: string, limit = 20) {
    return (this.prisma as any).question.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        author: { include: { profile: { select: { name: true, avatar: true } } } },
        _count: { select: { answers: true } },
      },
    });
  }

  async findOne(id: string) {
    const item = await (this.prisma as any).question.findUnique({
      where: { id },
      include: {
        author: { include: { profile: { select: { name: true, avatar: true } } } },
        answers: {
          include: { author: { include: { profile: { select: { name: true, avatar: true } } } } },
          orderBy: [{ isAccepted: 'desc' }, { votes: 'desc' }],
        },
      },
    });
    if (!item) throw new NotFoundException('Not found');
    return item;
  }

  async create(userId: string, data: any) {
    return (this.prisma as any).question.create({ data: { ...data, authorId: userId } });
  }

  async addAnswer(questionId: string, userId: string, content: string) {
    const answer = await (this.prisma as any).answer.create({
      data: { questionId, authorId: userId, content },
      include: { author: { include: { profile: { select: { name: true, avatar: true } } } } },
    });
    await (this.prisma as any).question.update({
      where: { id: questionId },
      data: { answerCount: { increment: 1 } },
    });
    return answer;
  }

  async acceptAnswer(answerId: string, questionId: string) {
    await (this.prisma as any).answer.updateMany({
      where: { questionId },
      data: { isAccepted: false },
    });
    await (this.prisma as any).answer.update({
      where: { id: answerId },
      data: { isAccepted: true },
    });
    await (this.prisma as any).question.update({
      where: { id: questionId },
      data: { isSolved: true },
    });
    return { success: true };
  }

  async remove(id: string) {
    await (this.prisma as any).question.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
