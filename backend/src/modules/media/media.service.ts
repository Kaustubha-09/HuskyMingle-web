import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(private prisma: PrismaService) {}

  async findAll(cursor?: string, limit = 20) {
    return (this.prisma as any).user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  async findOne(id: string) {
    const item = await (this.prisma as any).user.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    return item;
  }

  async create(userId: string, data: any) {
    return (this.prisma as any).user.create({ data: { ...data, authorId: userId } });
  }

  async update(id: string, data: any) {
    return (this.prisma as any).user.update({ where: { id }, data });
  }

  async remove(id: string) {
    await (this.prisma as any).user.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
