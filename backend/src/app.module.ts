import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { StoriesModule } from './modules/stories/stories.module';
import { ReelsModule } from './modules/reels/reels.module';
import { MessagesModule } from './modules/messages/messages.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { EventsModule } from './modules/events/events.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PollsModule } from './modules/polls/polls.module';
import { QaModule } from './modules/qa/qa.module';
import { AudioModule } from './modules/audio/audio.module';
import { CoursesModule } from './modules/courses/courses.module';
import { GamingModule } from './modules/gaming/gaming.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TranslationModule } from './modules/translation/translation.module';
import { MatchingModule } from './modules/matching/matching.module';
import { SearchModule } from './modules/search/search.module';
import { MediaModule } from './modules/media/media.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CanvasModule } from './modules/canvas/canvas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    StoriesModule,
    ReelsModule,
    MessagesModule,
    CommunitiesModule,
    MarketplaceModule,
    EventsModule,
    StreamingModule,
    JobsModule,
    ReviewsModule,
    PollsModule,
    QaModule,
    AudioModule,
    CoursesModule,
    GamingModule,
    NotificationsModule,
    TranslationModule,
    MatchingModule,
    SearchModule,
    MediaModule,
    BookmarksModule,
    DashboardModule,
    CanvasModule,
  ],
})
export class AppModule {}
