import { Controller, Get, Post, Body, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QaService } from './qa.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Q&A')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qa')
export class QaController {
  constructor(private readonly service: QaService) {}

  @Get()
  findAll(@Query('cursor') cursor?: string) {
    return this.service.findAll(cursor);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.service.create(userId, body);
  }

  @Post(':id/answers')
  addAnswer(
    @Param('id') questionId: string,
    @CurrentUser('id') userId: string,
    @Body('content') content: string,
  ) {
    return this.service.addAnswer(questionId, userId, content);
  }

  @Post(':id/answers/:answerId/accept')
  acceptAnswer(@Param('id') questionId: string, @Param('answerId') answerId: string) {
    return this.service.acceptAnswer(answerId, questionId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
