import { Controller, Get, Post, Body, Param, Delete, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GamingService } from './gaming.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Gaming')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gaming')
export class GamingController {
  constructor(private readonly service: GamingService) {}

  @Get() findAll(@Query('cursor') cursor?: string) { return this.service.findAll(cursor); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@CurrentUser('id') userId: string, @Body() body: any) { return this.service.create(userId, body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
