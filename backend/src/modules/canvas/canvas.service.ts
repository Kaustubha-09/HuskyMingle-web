import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

const NU_CANVAS_BASE = 'https://northeastern.instructure.com/api/v1';

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  enrollment_term_id: number;
  workflow_state: string;
  total_students?: number;
  teachers?: Array<{ display_name: string }>;
  term?: { name: string };
}

export interface CanvasAssignment {
  id: number;
  course_id: number;
  course_name?: string;
  course_code?: string;
  name: string;
  description?: string;
  due_at: string | null;
  points_possible: number | null;
  submission_types: string[];
  html_url: string;
  has_submitted_submissions: boolean;
}

@Injectable()
export class CanvasService {
  constructor(private prisma: PrismaService) {}

  // ── Token management ─────────────────────────────────────────────────────────

  async saveToken(userId: string, token: string) {
    // Validate the token first by hitting /api/v1/users/self
    const client = this._client(token);
    try {
      await client.get('/users/self');
    } catch {
      throw new UnauthorizedException(
        'Invalid Canvas token. Generate one at: northeastern.instructure.com → Account → Settings → New Access Token',
      );
    }

    await this.prisma.profile.update({
      where: { userId },
      data: { canvasToken: token },
    });
    return { message: 'Canvas token saved successfully' };
  }

  async removeToken(userId: string) {
    await this.prisma.profile.update({
      where: { userId },
      data: { canvasToken: null },
    });
    return { message: 'Canvas token removed' };
  }

  async hasToken(userId: string): Promise<boolean> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { canvasToken: true },
    });
    return !!profile?.canvasToken;
  }

  // ── Courses ──────────────────────────────────────────────────────────────────

  async getCourses(userId: string): Promise<CanvasCourse[]> {
    const token = await this._getToken(userId);
    const client = this._client(token);

    try {
      const res = await client.get<CanvasCourse[]>('/courses', {
        params: {
          enrollment_state: 'active',
          include: ['term', 'teachers', 'total_students'],
          per_page: 30,
        },
      });
      // Filter to only active courses with a real name
      return (res.data ?? []).filter(
        (c) => c.workflow_state === 'available' && c.name && !c.name.startsWith('_'),
      );
    } catch (e: any) {
      if (e.response?.status === 401) throw new UnauthorizedException('Canvas token expired or revoked');
      throw new BadRequestException('Failed to fetch Canvas courses');
    }
  }

  // ── Assignments ──────────────────────────────────────────────────────────────

  async getUpcomingAssignments(userId: string): Promise<CanvasAssignment[]> {
    const token = await this._getToken(userId);
    const client = this._client(token);

    let courses: CanvasCourse[];
    try {
      courses = await this.getCourses(userId);
    } catch {
      return [];
    }

    const now = new Date();
    const twoWeeksOut = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Fetch assignments for each course in parallel
    const results = await Promise.allSettled(
      courses.map(async (course) => {
        const res = await client.get<CanvasAssignment[]>(
          `/courses/${course.id}/assignments`,
          {
            params: {
              order_by: 'due_at',
              bucket: 'upcoming',
              per_page: 10,
            },
          },
        );
        return (res.data ?? [])
          .filter((a) => {
            if (!a.due_at) return false;
            const due = new Date(a.due_at);
            return due >= now && due <= twoWeeksOut;
          })
          .map((a) => ({
            ...a,
            course_name: course.name,
            course_code: course.course_code,
          }));
      }),
    );

    const all: CanvasAssignment[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') all.push(...r.value);
    }

    // Sort by due date ascending
    return all.sort((a, b) => {
      if (!a.due_at) return 1;
      if (!b.due_at) return -1;
      return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
    });
  }

  // ── Dashboard summary (courses + next 5 assignments) ─────────────────────────

  async getDashboard(userId: string) {
    const hasToken = await this.hasToken(userId);
    if (!hasToken) {
      return { connected: false, courses: [], assignments: [] };
    }

    const [courses, assignments] = await Promise.allSettled([
      this.getCourses(userId),
      this.getUpcomingAssignments(userId),
    ]);

    return {
      connected: true,
      courses: courses.status === 'fulfilled' ? courses.value : [],
      assignments: assignments.status === 'fulfilled' ? assignments.value.slice(0, 10) : [],
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  private async _getToken(userId: string): Promise<string> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { canvasToken: true },
    });
    if (!profile?.canvasToken) {
      throw new BadRequestException(
        'No Canvas token saved. Go to Settings → Connect Canvas to add your token.',
      );
    }
    return profile.canvasToken;
  }

  private _client(token: string): AxiosInstance {
    return axios.create({
      baseURL: NU_CANVAS_BASE,
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    });
  }
}
