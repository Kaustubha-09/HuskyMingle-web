import { Controller, Get, Post, Body, Param, Delete, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Marketplace')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly service: MarketplaceService) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('condition') condition?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.service.findAll({ cursor, search, category, condition, maxPrice: maxPrice ? Number(maxPrice) : undefined, userId });
  }

  @Get('mine')
  findMine(@CurrentUser('id') userId: string) {
    return this.service.findMine(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.service.create(userId, body);
  }

  @Patch(':id')
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() body: any) {
    return this.service.update(id, userId, body);
  }

  @Patch(':id/sold')
  markSold(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.markSold(id, userId);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.remove(id, userId);
  }
}
