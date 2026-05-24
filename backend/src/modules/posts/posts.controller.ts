import { Controller, Get, Post, Body, Param, Delete, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('feed')
  getFeed(@CurrentUser('id') userId: string, @Query('cursor') cursor?: string, @Query('limit') limit?: number) {
    return this.postsService.getFeed(userId, cursor, limit);
  }

  @Get('user/:username')
  findByUsername(@Param('username') username: string) {
    return this.postsService.findByUsername(username);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.postsService.create(userId, body);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.postsService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() body: any) {
    return this.postsService.update(id, userId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.postsService.remove(id, userId);
  }

  @Post(':id/react')
  react(@Param('id') postId: string, @CurrentUser('id') userId: string, @Body() body: { type?: string }) {
    return this.postsService.react(postId, userId, body.type);
  }

  @Get(':id/comments')
  getComments(@Param('id') postId: string, @Query('cursor') cursor?: string, @Query('limit') limit?: number) {
    return this.postsService.getComments(postId, cursor, limit);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { content: string; parentId?: string },
  ) {
    return this.postsService.addComment(postId, userId, body.content, body.parentId);
  }
}
