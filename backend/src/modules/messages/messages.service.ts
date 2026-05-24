import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TranslationService } from '../translation/translation.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private translationService: TranslationService,
  ) {}

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true, username: true, email: true,
                profile: { select: { name: true, avatar: true } },
              },
            },
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async createConversation(userId: string, participantIds: string[], type = 'DM', name?: string) {
    // For DM, check if conversation already exists
    if (type === 'DM' && participantIds.length === 1) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          type: 'DM',
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: participantIds[0] } } },
          ],
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true, username: true, email: true,
                  profile: { select: { name: true, avatar: true } },
                },
              },
            },
          },
        },
      });
      if (existing) return existing;
    }

    return this.prisma.conversation.create({
      data: {
        type: type as any,
        name,
        participants: {
          create: [userId, ...participantIds].map(uid => ({
            userId: uid,
            role: uid === userId ? 'ADMIN' : 'MEMBER',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true, username: true, email: true,
                profile: { select: { name: true, avatar: true } },
              },
            },
          },
        },
      },
    });
  }

  async getMessages(conversationId: string, userId: string, cursor?: string, limit = 50) {
    // Verify user is participant
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant) throw new ForbiddenException('Not a participant');

    return this.prisma.message.findMany({
      where: {
        conversationId,
        NOT: { deletedFor: { has: userId } },
      },
      include: {
        sender: { include: { profile: { select: { name: true, avatar: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  async sendMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
    type?: string;
    mediaUrl?: string;
    replyToId?: string;
  }) {
    // Get conversation participants and their language preferences
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId: data.conversationId },
    });

    // Detect source language
    const sourceLang = await this.translationService.detectLanguage(data.content);

    // Translate for all unique recipient languages
    const recipientLangs = participants
      .filter(p => p.userId !== data.senderId)
      .map(p => p.preferredLanguage);

    let translations: Record<string, string> = {};
    if (recipientLangs.length > 0) {
      translations = await this.translationService.translateForRecipients(
        data.content,
        sourceLang,
        recipientLangs,
      );
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        originalContent: data.content,
        originalLanguage: sourceLang,
        translations,
        type: (data.type as any) || 'TEXT',
        mediaUrl: data.mediaUrl,
        replyToId: data.replyToId,
      },
      include: {
        sender: { include: { profile: { select: { name: true, avatar: true } } } },
      },
    });

    // Update conversation lastMessageAt
    await this.prisma.conversation.update({
      where: { id: data.conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async markAsRead(conversationId: string, userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        NOT: { readBy: { has: userId } },
        senderId: { not: userId },
      },
      select: { id: true, readBy: true },
    });

    await Promise.all(
      messages.map(msg =>
        this.prisma.message.update({
          where: { id: msg.id },
          data: { readBy: { push: userId } },
        }),
      ),
    );

    await this.prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() },
    });
  }

  async updateLanguagePreference(conversationId: string, userId: string, language: string) {
    return this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { preferredLanguage: language },
    });
  }
}
