import { Controller, Get, Post, Body, Param, Delete, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly service: CoursesService) {}

  @Get() findAll(@Query('cursor') cursor?: string) { return this.service.findAll(cursor); }
  @Get('enrolled') getEnrolled(@CurrentUser('id') userId: string) { return this.service.getEnrolled(userId); }
  @Post(':id/enroll') enroll(@Param('id') id: string, @CurrentUser('id') userId: string) { return this.service.enroll(id, userId); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@CurrentUser('id') userId: string, @Body() body: any) { return this.service.create(userId, body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
