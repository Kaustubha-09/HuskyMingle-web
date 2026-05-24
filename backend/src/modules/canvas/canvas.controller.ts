import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CanvasService } from './canvas.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Canvas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('canvas')
export class CanvasController {
  constructor(private readonly service: CanvasService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Canvas dashboard (courses + upcoming assignments)' })
  getDashboard(@CurrentUser('id') userId: string) {
    return this.service.getDashboard(userId);
  }

  @Get('courses')
  @ApiOperation({ summary: 'Get active Canvas courses' })
  getCourses(@CurrentUser('id') userId: string) {
    return this.service.getCourses(userId);
  }

  @Get('assignments')
  @ApiOperation({ summary: 'Get upcoming assignments (next 14 days)' })
  getAssignments(@CurrentUser('id') userId: string) {
    return this.service.getUpcomingAssignments(userId);
  }

  @Post('token')
  @ApiOperation({ summary: 'Save Canvas personal access token' })
  saveToken(@CurrentUser('id') userId: string, @Body() body: { token: string }) {
    return this.service.saveToken(userId, body.token);
  }

  @Delete('token')
  @ApiOperation({ summary: 'Remove Canvas token' })
  removeToken(@CurrentUser('id') userId: string) {
    return this.service.removeToken(userId);
  }
}
