import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { cursor?: string; limit?: number; search?: string; category?: string; userId?: string }) {
    const { cursor, limit = 25, search, category, userId } = params;
    const where: any = { type: { not: 'PRIVATE' } };
    if (search) where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
    if (category) where.category = category;

    const communities = await this.prisma.community.findMany({
      where,
      include: {
        _count: { select: { members: true, posts: true } },
        ...(userId ? { members: { where: { userId }, select: { id: true } } } : {}),
      },
      orderBy: [{ isNuOfficial: 'desc' }, { memberCount: 'desc' }],
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return communities.map(c => {
      const { members, ...rest } = c as any;
      return { ...rest, isJoined: userId ? (members?.length ?? 0) > 0 : false };
    });
  }

  async findOne(slug: string, userId?: string) {
    const c = await this.prisma.community.findUnique({
      where: { slug },
      include: {
        _count: { select: { members: true, posts: true } },
        ...(userId ? { members: { where: { userId }, select: { id: true, role: true } } } : {}),
      },
    });
    if (!c) throw new NotFoundException('Community not found');
    const { members, ...rest } = c as any;
    return {
      ...rest,
      isJoined: userId ? (members?.length ?? 0) > 0 : false,
      memberRole: userId ? members?.[0]?.role ?? null : null,
    };
  }

  async getMyCommunities(userId: string) {
    const memberships = await this.prisma.communityMember.findMany({
      where: { userId },
      include: { community: { include: { _count: { select: { members: true, posts: true } } } } },
      orderBy: { community: { memberCount: 'desc' } },
    });
    return memberships.map(m => ({ ...m.community, isJoined: true, memberRole: m.role }));
  }

  async getTrending(limit = 6) {
    return this.prisma.community.findMany({
      where: { type: { not: 'PRIVATE' } },
      include: { _count: { select: { members: true, posts: true } } },
      orderBy: [{ isNuOfficial: 'desc' }, { memberCount: 'desc' }],
      take: limit,
    });
  }

  async create(userId: string, data: any) {
    const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return this.prisma.community.create({
      data: { ...data, slug, members: { create: { userId, role: 'ADMIN' } } },
    });
  }

  async join(userId: string, communityId: string) {
    const existing = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (existing) {
      await this.prisma.communityMember.delete({ where: { communityId_userId: { communityId, userId } } });
      await this.prisma.community.update({ where: { id: communityId }, data: { memberCount: { decrement: 1 } } });
      return { joined: false };
    }
    await this.prisma.communityMember.create({ data: { communityId, userId } });
    await this.prisma.community.update({ where: { id: communityId }, data: { memberCount: { increment: 1 } } });
    return { joined: true };
  }

  async getPosts(communityId: string, params: { cursor?: string; limit?: number; userId?: string; sort?: string }) {
    const { cursor, limit = 20, userId, sort = 'hot' } = params;
    const orderBy: any =
      sort === 'new' ? { createdAt: 'desc' } :
      sort === 'top' ? { upvotes: 'desc' } :
      [{ isPinned: 'desc' }, { upvotes: 'desc' }];

    const posts = await this.prisma.communityPost.findMany({
      where: { communityId },
      include: {
        author: { include: { profile: { select: { name: true, avatar: true, university: true } } } },
        _count: { select: { votes: true } },
        ...(userId ? { votes: { where: { userId }, select: { value: true } } } : {}),
      },
      orderBy,
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    return posts.map(p => {
      const { votes, ...rest } = p as any;
      return { ...rest, userVote: userId ? (votes?.[0]?.value ?? 0) : 0 };
    });
  }

  async createPost(userId: string, communityId: string, data: any) {
    const post = await this.prisma.communityPost.create({
      data: { ...data, authorId: userId, communityId },
      include: { author: { include: { profile: { select: { name: true, avatar: true } } } } },
    });
    await this.prisma.community.update({ where: { id: communityId }, data: { postCount: { increment: 1 } } });
    return post;
  }

  async vote(userId: string, postId: string, value: number) {
    const existing = await this.prisma.vote.findUnique({
      where: { userId_communityPostId: { userId, communityPostId: postId } },
    });
    if (existing) {
      await this.prisma.vote.delete({ where: { userId_communityPostId: { userId, communityPostId: postId } } });
      await this.prisma.communityPost.update({
        where: { id: postId },
        data: existing.value === 1 ? { upvotes: { decrement: 1 } } : { downvotes: { decrement: 1 } },
      });
      return { voted: false };
    }
    await this.prisma.vote.create({ data: { userId, communityPostId: postId, value } });
    await this.prisma.communityPost.update({
      where: { id: postId },
      data: value === 1 ? { upvotes: { increment: 1 } } : { downvotes: { increment: 1 } },
    });
    return { voted: true, value };
  }
}
