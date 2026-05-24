import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const { password, refreshToken, ...safe } = user;
    const isFollowing = currentUserId
      ? !!(await this.prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: currentUserId, followingId: user.id } },
        }))
      : false;
    return { ...safe, isFollowing };
  }

  async updateProfile(userId: string, data: any) {
    return this.prisma.profile.update({
      where: { userId },
      data,
    });
  }

  async completeOnboarding(userId: string, data: {
    major?: string;
    year?: string;
    interests: string[];
    skills: string[];
    languages: string[];
  }) {
    const profile = await this.prisma.profile.update({
      where: { userId },
      data: {
        major: data.major,
        year: data.year,
        interests: data.interests,
        skills: data.skills,
        languages: data.languages,
        hasOnboarded: true,
      },
    });
    return profile;
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new Error('Cannot follow yourself');
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) {
      await this.prisma.follow.delete({ where: { followerId_followingId: { followerId, followingId } } });
      await this.prisma.profile.update({ where: { userId: followerId }, data: { followingCount: { decrement: 1 } } });
      await this.prisma.profile.update({ where: { userId: followingId }, data: { followersCount: { decrement: 1 } } });
      return { following: false };
    }
    await this.prisma.follow.create({ data: { followerId, followingId } });
    await this.prisma.profile.update({ where: { userId: followerId }, data: { followingCount: { increment: 1 } } });
    await this.prisma.profile.update({ where: { userId: followingId }, data: { followersCount: { increment: 1 } } });
    return { following: true };
  }

  async getFollowers(userId: string, cursor?: string, limit = 20) {
    return this.prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: { include: { profile: { select: { name: true, avatar: true, university: true } } } } },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  async getFollowing(userId: string, cursor?: string, limit = 20) {
    return this.prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: { include: { profile: { select: { name: true, avatar: true, university: true } } } } },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  async searchUsers(query: string, limit = 20) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { profile: { name: { contains: query, mode: 'insensitive' } } },
          { profile: { university: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: { profile: { select: { name: true, avatar: true, university: true } } },
      take: limit,
    });
  }
}
