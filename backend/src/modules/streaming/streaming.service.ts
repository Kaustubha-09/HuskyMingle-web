import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StreamingService {
  constructor(private prisma: PrismaService) {}

  async findAll(cursor?: string, limit = 20) {
    return (this.prisma as any).liveStream.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  async findOne(id: string) {
    const item = await (this.prisma as any).liveStream.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    return item;
  }

  async create(userId: string, data: any) {
    return (this.prisma as any).liveStream.create({ data: { ...data, authorId: userId } });
  }

  async update(id: string, data: any) {
    return (this.prisma as any).liveStream.update({ where: { id }, data });
  }

  async remove(id: string) {
    await (this.prisma as any).liveStream.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
