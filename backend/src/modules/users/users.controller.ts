import { Controller, Get, Param, Patch, Post, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  search(@Query('q') query: string) { return this.usersService.searchUsers(query); }

  @Get(':username')
  findOne(@Param('username') username: string, @CurrentUser('id') userId: string) {
    return this.usersService.findByUsername(username, userId);
  }

  @Patch('profile')
  updateProfile(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.usersService.updateProfile(userId, body);
  }

  @Post('onboarding')
  completeOnboarding(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.usersService.completeOnboarding(userId, body);
  }

  @Post(':id/follow')
  follow(@CurrentUser('id') followerId: string, @Param('id') followingId: string) {
    return this.usersService.follow(followerId, followingId);
  }

  @Get(':id/followers')
  getFollowers(@Param('id') userId: string, @Query('cursor') cursor?: string) {
    return this.usersService.getFollowers(userId, cursor);
  }

  @Get(':id/following')
  getFollowing(@Param('id') userId: string, @Query('cursor') cursor?: string) {
    return this.usersService.getFollowing(userId, cursor);
  }
}
