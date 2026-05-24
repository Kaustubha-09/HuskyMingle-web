import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Communities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly service: CommunitiesService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.service.findAll({ cursor, search, category, userId });
  }

  @Get('mine')
  getMine(@CurrentUser('id') userId: string) {
    return this.service.getMyCommunities(userId);
  }

  @Get('trending')
  getTrending() {
    return this.service.getTrending();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string, @CurrentUser('id') userId: string) {
    return this.service.findOne(slug, userId);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.service.create(userId, body);
  }

  @Post(':id/join')
  join(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.join(userId, id);
  }

  @Get(':id/posts')
  getPosts(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('sort') sort?: string,
  ) {
    return this.service.getPosts(id, { cursor, userId, sort });
  }

  @Post(':id/posts')
  createPost(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() body: any) {
    return this.service.createPost(userId, id, body);
  }

  @Post('posts/:id/vote')
  vote(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() body: { value: number }) {
    return this.service.vote(userId, id, body.value);
  }
}
