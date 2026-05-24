import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  getConversations(@CurrentUser('id') userId: string) {
    return this.messagesService.getConversations(userId);
  }

  @Post('conversations')
  createConversation(
    @CurrentUser('id') userId: string,
    @Body() body: { participantIds: string[]; type?: string; name?: string },
  ) {
    return this.messagesService.createConversation(userId, body.participantIds, body.type, body.name);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.messagesService.getMessages(conversationId, userId, cursor, limit);
  }

  @Post('conversations/:id/read')
  markAsRead(@Param('id') conversationId: string, @CurrentUser('id') userId: string) {
    return this.messagesService.markAsRead(conversationId, userId);
  }

  @Patch('conversations/:id/language')
  updateLanguage(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { language: string },
  ) {
    return this.messagesService.updateLanguagePreference(conversationId, userId, body.language);
  }
}
