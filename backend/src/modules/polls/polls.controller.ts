import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PollsService } from './polls.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Polls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('polls')
export class PollsController {
  constructor(private readonly service: PollsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query('cursor') cursor?: string) {
    return this.service.findAll(userId, cursor);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.service.create(userId, body);
  }

  @Post(':id/vote')
  vote(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('optionIndex') optionIndex: number,
  ) {
    return this.service.vote(id, userId, optionIndex);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
