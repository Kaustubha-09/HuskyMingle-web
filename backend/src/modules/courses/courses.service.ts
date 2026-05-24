import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(cursor?: string, limit = 20) {
    return (this.prisma as any).course.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  async findOne(id: string) {
    const item = await (this.prisma as any).course.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Not found');
    return item;
  }

  async create(userId: string, data: any) {
    return (this.prisma as any).course.create({ data: { ...data, authorId: userId } });
  }

  async update(id: string, data: any) {
    return (this.prisma as any).course.update({ where: { id }, data });
  }

  async remove(id: string) {
    await (this.prisma as any).course.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  async getEnrolled(userId: string) {
    const enrollments = await (this.prisma as any).courseEnrollment.findMany({
      where: { userId },
      include: { course: true },
      orderBy: { enrolledAt: 'desc' },
    });
    return enrollments.map((e: any) => ({ ...e.course, progress: e.progress, enrolledAt: e.enrolledAt }));
  }

  async enroll(courseId: string, userId: string) {
    const existing = await (this.prisma as any).courseEnrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });
    if (existing) return existing;
    await (this.prisma as any).course.update({
      where: { id: courseId },
      data: { enrollmentCount: { increment: 1 } },
    });
    return (this.prisma as any).courseEnrollment.create({ data: { courseId, userId } });
  }
}
