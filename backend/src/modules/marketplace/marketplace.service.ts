import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    cursor?: string;
    limit?: number;
    search?: string;
    category?: string;
    condition?: string;
    maxPrice?: number;
    userId?: string;
  }) {
    const { cursor, limit = 24, search, category, condition, maxPrice, userId } = params;
    const where: any = { status: 'ACTIVE' };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search.toLowerCase() } },
      ];
    }
    if (category && category !== 'All') where.category = category;
    if (condition) where.condition = condition;
    if (maxPrice) where.price = { lte: maxPrice };

    const items = await this.prisma.product.findMany({
      where,
      include: {
        seller: { include: { profile: { select: { name: true, avatar: true, university: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return items;
  }

  async findMine(userId: string) {
    return this.prisma.product.findMany({
      where: { sellerId: userId },
      include: {
        seller: { include: { profile: { select: { name: true, avatar: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.product.findUnique({
      where: { id },
      include: {
        seller: { include: { profile: { select: { name: true, avatar: true, university: true } } } },
      },
    });
    if (!item) throw new NotFoundException('Listing not found');
    // bump view count
    await this.prisma.product.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return item;
  }

  async create(userId: string, data: {
    title: string;
    description: string;
    price: number;
    category: string;
    condition?: string;
    images?: string[];
    tags?: string[];
  }) {
    return this.prisma.product.create({
      data: {
        ...data,
        price: Number(data.price),
        condition: (data.condition as any) || 'GOOD',
        sellerId: userId,
        images: data.images ?? [],
        tags: data.tags ?? [],
      },
      include: {
        seller: { include: { profile: { select: { name: true, avatar: true } } } },
      },
    });
  }

  async update(id: string, userId: string, data: any) {
    const item = await this.prisma.product.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Listing not found');
    if (item.sellerId !== userId) throw new ForbiddenException('Not your listing');
    return this.prisma.product.update({ where: { id }, data });
  }

  async markSold(id: string, userId: string) {
    const item = await this.prisma.product.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Listing not found');
    if (item.sellerId !== userId) throw new ForbiddenException('Not your listing');
    return this.prisma.product.update({ where: { id }, data: { status: 'SOLD' } });
  }

  async remove(id: string, userId: string) {
    const item = await this.prisma.product.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Listing not found');
    if (item.sellerId !== userId) throw new ForbiddenException('Not your listing');
    await this.prisma.product.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
