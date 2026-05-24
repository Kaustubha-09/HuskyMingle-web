import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TranslationService } from './translation.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IsString, IsOptional } from 'class-validator';

class TranslateDto {
  @IsString() text: string;
  @IsString() targetLang: string;
  @IsOptional() @IsString() sourceLang?: string;
}

@ApiTags('Translation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post('translate')
  translate(@Body() dto: TranslateDto) {
    return this.translationService.translate(dto.text, dto.targetLang, dto.sourceLang);
  }

  @Post('detect')
  detect(@Body() body: { text: string }) {
    return this.translationService.detectLanguage(body.text);
  }
}
