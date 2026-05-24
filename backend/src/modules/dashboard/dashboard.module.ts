import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { CanvasModule } from '../canvas/canvas.module';

@Module({
  imports: [CanvasModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
