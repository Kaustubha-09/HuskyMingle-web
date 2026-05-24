import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';

// NU Student Life WordPress REST API
const NU_EVENTS_API = 'https://studentlife.northeastern.edu/wp-json/tribe/events/v1/events';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private prisma: PrismaService) {}

  // ── List events ─────────────────────────────────────────────────────────────

  async findAll(params: {
    cursor?: string;
    limit?: number;
    from?: string;  // ISO date filter
    to?: string;
    nuOnly?: boolean;
  } = {}) {
    const { cursor, limit = 30, from, to, nuOnly } = params;

    const where: any = {};
    if (nuOnly) where.isNuOfficial = true;
    if (from || to) {
      where.startDate = {};
      if (from) where.startDate.gte = new Date(from);
      if (to) where.startDate.lte = new Date(to);
    }

    return this.prisma.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        organizer: { include: { profile: { select: { name: true, avatar: true } } } },
        _count: { select: { attendees: true } },
      },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { include: { profile: { select: { name: true, avatar: true, university: true } } } },
        _count: { select: { attendees: true } },
      },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  // ── RSVP ─────────────────────────────────────────────────────────────────────

  async rsvp(eventId: string, userId: string) {
    const existing = await this.prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing) {
      await this.prisma.eventAttendee.delete({
        where: { eventId_userId: { eventId, userId } },
      });
      return { attending: false };
    }
    await this.prisma.eventAttendee.create({
      data: { eventId, userId, status: 'GOING' },
    });
    return { attending: true };
  }

  async getAttendees(eventId: string, limit = 20) {
    return this.prisma.eventAttendee.findMany({
      where: { eventId },
      take: limit,
      include: { user: { include: { profile: { select: { name: true, avatar: true } } } } },
    });
  }

  async getFriendsAttending(eventId: string, userId: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map(f => f.followingId);
    if (followingIds.length === 0) return [];

    return this.prisma.eventAttendee.findMany({
      where: { eventId, userId: { in: followingIds } },
      take: 10,
      include: { user: { include: { profile: { select: { name: true, avatar: true } } } } },
    });
  }

  // ── ICS export ───────────────────────────────────────────────────────────────

  async generateIcs(eventId: string): Promise<string> {
    const event = await this.findOne(eventId);

    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const escape = (s: string) =>
      s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HuskyMingle//NU Events//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id}@huskymingle.app`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(event.startDate)}`,
      `DTEND:${fmt(event.endDate)}`,
      `SUMMARY:${escape(event.title)}`,
      `DESCRIPTION:${escape(event.description || '')}`,
      event.location ? `LOCATION:${escape(event.location)}` : '',
      event.sourceUrl ? `URL:${event.sourceUrl}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean);

    return lines.join('\r\n');
  }

  // ── Create / Update / Delete (user-created events) ────────────────────────

  async create(organizerId: string, data: any) {
    return this.prisma.event.create({
      data: { ...data, organizerId },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.event.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.event.delete({ where: { id } });
    return { message: 'Deleted' };
  }

  // ── Cron: sync NU events every hour ─────────────────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async syncNuEvents() {
    this.logger.log('Starting NU events sync...');
    try {
      await this._fetchAndUpsertNuEvents();
    } catch (err) {
      this.logger.error('NU events sync failed', err);
    }
  }

  // Manual trigger (for testing / initial seeding)
  async syncNow() {
    return this._fetchAndUpsertNuEvents();
  }

  private async _fetchAndUpsertNuEvents() {
    let page = 1;
    let totalSynced = 0;

    // Fetch system organizer (first admin/mod, or alex for dev)
    let systemUser = await this.prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'MODERATOR'] } },
    });
    if (!systemUser) {
      systemUser = await this.prisma.user.findFirst();
    }
    if (!systemUser) {
      this.logger.warn('No users in DB — skipping sync');
      return { synced: 0 };
    }

    while (true) {
      let data: any;
      try {
        const res = await axios.get(NU_EVENTS_API, {
          params: { per_page: 50, page, start_date: new Date().toISOString().split('T')[0] },
          timeout: 10000,
        });
        data = res.data;
      } catch (err: any) {
        // NU API unreachable (test / no internet) — gracefully stop
        this.logger.warn(`NU API fetch failed (page ${page}): ${err.message}`);
        break;
      }

      const events = data?.events ?? [];
      if (events.length === 0) break;

      for (const e of events) {
        try {
          await this.prisma.event.upsert({
            where: { nuEventId: String(e.id) },
            update: {
              title: this._stripHtml(e.title || 'NU Event'),
              description: this._stripHtml(e.description || ''),
              coverImage: e.image?.url ?? null,
              startDate: new Date(e.start_date),
              endDate: new Date(e.end_date || e.start_date),
              location: e.venue?.address ?? e.venue?.venue ?? null,
              isVirtual: e.virtual_url ? true : false,
              meetingUrl: e.virtual_url ?? null,
              tags: (e.tags ?? []).map((t: any) => t.name),
              sourceUrl: e.url ?? null,
              status: 'PUBLISHED',
            },
            create: {
              nuEventId: String(e.id),
              title: this._stripHtml(e.title || 'NU Event'),
              description: this._stripHtml(e.description || ''),
              coverImage: e.image?.url ?? null,
              startDate: new Date(e.start_date),
              endDate: new Date(e.end_date || e.start_date),
              location: e.venue?.address ?? e.venue?.venue ?? null,
              isVirtual: e.virtual_url ? true : false,
              meetingUrl: e.virtual_url ?? null,
              tags: (e.tags ?? []).map((t: any) => t.name),
              sourceUrl: e.url ?? null,
              isNuOfficial: true,
              status: 'PUBLISHED',
              organizerId: systemUser!.id,
            },
          });
          totalSynced++;
        } catch (upsertErr) {
          this.logger.warn(`Failed to upsert event ${e.id}: ${upsertErr}`);
        }
      }

      if (!data.next_rest_url) break;
      page++;
    }

    this.logger.log(`NU events sync complete — ${totalSynced} events upserted`);
    return { synced: totalSynced };
  }

  private _stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8217;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"').trim();
  }
}
