import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async getFeed(userId: string, cursor?: string, limit = 20) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);

    return this.prisma.post.findMany({
      where: {
        OR: [
          { authorId: { in: [...followingIds, userId] } },
          { visibility: 'PUBLIC' },
        ],
      },
      include: {
        author: { include: { profile: { select: { name: true, avatar: true, university: true } } } },
        reactions: { where: { userId }, select: { type: true } },
        poll: true,
        _count: { select: { comments: true, reactions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  async create(userId: string, data: any) {
    const post = await this.prisma.post.create({
      data: { ...data, authorId: userId },
      include: {
        author: { include: { profile: { select: { name: true, avatar: true } } } },
      },
    });
    await this.prisma.profile.update({
      where: { userId },
      data: { postsCount: { increment: 1 } },
    });
    return post;
  }

  async findOne(id: string, userId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: { include: { profile: true } },
        reactions: userId ? { where: { userId } } : false,
        poll: true,
        _count: { select: { comments: true, reactions: true } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    await this.prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return post;
  }

  async findByUsername(username: string, limit = 20) {
    const user = await this.prisma.user.findUnique({ where: { username }, select: { id: true } });
    if (!user) return [];
    return this.prisma.post.findMany({
      where: { authorId: user.id, visibility: 'PUBLIC' },
      include: {
        author: { include: { profile: { select: { name: true, avatar: true, university: true } } } },
        _count: { select: { comments: true, reactions: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async update(id: string, userId: string, data: any) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');
    return this.prisma.post.update({ where: { id }, data: { ...data, isEdited: true } });
  }

  async remove(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');
    await this.prisma.post.delete({ where: { id } });
    await this.prisma.profile.update({ where: { userId }, data: { postsCount: { decrement: 1 } } });
    return { message: 'Post deleted' };
  }

  async react(postId: string, userId: string, type = 'LIKE') {
    const existing = await this.prisma.reaction.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (existing) {
      if (existing.type === type) {
        await this.prisma.reaction.delete({ where: { userId_postId: { userId, postId } } });
        await this.prisma.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } });
        return { reacted: false };
      }
      return this.prisma.reaction.update({ where: { userId_postId: { userId, postId } }, data: { type: type as any } });
    }
    await this.prisma.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } });
    return this.prisma.reaction.create({ data: { userId, postId, type: type as any } });
  }

  async getComments(postId: string, cursor?: string, limit = 20) {
    return this.prisma.comment.findMany({
      where: { postId, parentId: null },
      include: {
        author: { include: { profile: { select: { name: true, avatar: true } } } },
        replies: {
          include: { author: { include: { profile: { select: { name: true, avatar: true } } } } },
          take: 3,
        },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  async addComment(postId: string, userId: string, content: string, parentId?: string) {
    const comment = await this.prisma.comment.create({
      data: { postId, authorId: userId, content, parentId },
      include: { author: { include: { profile: { select: { name: true, avatar: true } } } } },
    });
    await this.prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });
    return comment;
  }

  async getUserPosts(username: string, cursor?: string, limit = 20) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.post.findMany({
      where: { authorId: user.id, visibility: 'PUBLIC' },
      include: { _count: { select: { comments: true, reactions: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }
}
