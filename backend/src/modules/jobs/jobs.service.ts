import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, cursor?: string, limit = 20, type?: string, remote?: boolean) {
    const where: any = {};
    if (type) where.type = type;
    if (remote !== undefined) where.isRemote = remote;

    const jobs = await (this.prisma as any).job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        poster: { include: { profile: { select: { name: true, avatar: true } } } },
        _count: { select: { applications: true } },
        applications: { where: { userId }, select: { id: true, status: true } },
      },
    });

    return jobs.map((j: any) => ({
      ...j,
      hasApplied: j.applications.length > 0,
      applicationStatus: j.applications[0]?.status ?? null,
      applications: undefined,
    }));
  }

  async findOne(id: string) {
    const item = await (this.prisma as any).job.findUnique({
      where: { id },
      include: {
        poster: { include: { profile: { select: { name: true, avatar: true } } } },
        _count: { select: { applications: true } },
      },
    });
    if (!item) throw new NotFoundException('Not found');
    return item;
  }

  async apply(jobId: string, userId: string, coverLetter?: string) {
    return (this.prisma as any).jobApplication.upsert({
      where: { jobId_userId: { jobId, userId } },
      update: {},
      create: { jobId, userId, coverLetter: coverLetter ?? '' },
    });
  }

  async create(userId: string, data: any) {
    return (this.prisma as any).job.create({ data: { ...data, posterId: userId } });
  }

  async update(id: string, data: any) {
    return (this.prisma as any).job.update({ where: { id }, data });
  }

  async remove(id: string) {
    await (this.prisma as any).job.delete({ where: { id } });
    return { message: 'Deleted' };
  }
}
