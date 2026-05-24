import { Controller, Get, Post, Body, Param, Delete, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly service: JobsService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('type') type?: string,
    @Query('remote') remote?: string,
  ) {
    return this.service.findAll(userId, cursor, 20, type, remote === 'true' ? true : undefined);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/apply')
  apply(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('coverLetter') coverLetter?: string,
  ) {
    return this.service.apply(id, userId, coverLetter);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.service.create(userId, body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
