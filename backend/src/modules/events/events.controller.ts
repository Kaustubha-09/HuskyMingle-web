import {
  Controller, Get, Post, Body, Param, Delete, Patch,
  Query, UseGuards, Res, HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly service: EventsService) {}

  @Public()
  @Get()
  findAll(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('nuOnly') nuOnly?: string,
  ) {
    return this.service.findAll({ cursor, limit, from, to, nuOnly: nuOnly === 'true' });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Public()
  @Get(':id/ics')
  async downloadIcs(@Param('id') id: string, @Res() res: Response) {
    const ics = await this.service.generateIcs(id);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="event-${id}.ics"`);
    res.status(HttpStatus.OK).send(ics);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.service.create(userId, body);
  }

  @Post(':id/rsvp')
  rsvp(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.rsvp(id, userId);
  }

  @Get(':id/attendees')
  getAttendees(@Param('id') id: string) {
    return this.service.getAttendees(id);
  }

  @Get(':id/friends-attending')
  getFriendsAttending(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.service.getFriendsAttending(id, userId);
  }

  // Manual sync trigger (admin use)
  @Post('sync/nu')
  syncNu() { return this.service.syncNow(); }

  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
