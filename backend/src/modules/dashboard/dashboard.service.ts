import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { CanvasService } from '../canvas/canvas.service';

// Boston, MA coordinates (NU main campus)
const BOSTON_LAT = 42.3398;
const BOSTON_LON = -71.0892;

const WEATHER_ICONS: Record<string, string> = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '⛅',
  '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '❄️', '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
};

const NU_RESOURCES = [
  { label: 'myNortheastern', icon: '🎓', url: 'https://my.northeastern.edu' },
  { label: 'Canvas', icon: '📚', url: 'https://northeastern.instructure.com' },
  { label: 'NUflex Library', icon: '📖', url: 'https://library.northeastern.edu' },
  { label: 'Student Hub', icon: '🏠', url: 'https://studenthub.northeastern.edu' },
  { label: 'Dining', icon: '🍽️', url: 'https://nudining.com' },
  { label: 'Career Center', icon: '💼', url: 'https://careers.northeastern.edu' },
  { label: 'IT Help Desk', icon: '🖥️', url: 'https://nuit.northeastern.edu' },
  { label: 'Health Services', icon: '🏥', url: 'https://www.northeastern.edu/uhcs' },
  { label: 'NU Maps', icon: '🗺️', url: 'https://campusmap.northeastern.edu' },
  { label: 'Viva Engage', icon: '💬', url: 'https://web.yammer.com' },
];

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private prisma: PrismaService,
    private canvas: CanvasService,
  ) {}

  async getMyDay(userId: string) {
    const [weather, todayEvents, unreadMessages, unreadNotifications, upcomingRsvps, canvasDash] =
      await Promise.allSettled([
        this._getWeather(),
        this._getTodayEvents(),
        this._getUnreadMessageCount(userId),
        this._getUnreadNotificationCount(userId),
        this._getUpcomingRsvps(userId),
        this.canvas.getDashboard(userId),
      ]);

    return {
      weather: weather.status === 'fulfilled' ? weather.value : this._mockWeather(),
      todayEvents: todayEvents.status === 'fulfilled' ? todayEvents.value : [],
      unreadMessages: unreadMessages.status === 'fulfilled' ? unreadMessages.value : 0,
      unreadNotifications: unreadNotifications.status === 'fulfilled' ? unreadNotifications.value : 0,
      upcomingRsvps: upcomingRsvps.status === 'fulfilled' ? upcomingRsvps.value : [],
      canvas: canvasDash.status === 'fulfilled' ? canvasDash.value : { connected: false, courses: [], assignments: [] },
      nuResources: NU_RESOURCES,
      greeting: this._greeting(),
      dateLabel: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    };
  }

  private async _getWeather() {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) return this._mockWeather();

    const res = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat: BOSTON_LAT, lon: BOSTON_LON, appid: apiKey, units: 'imperial' },
      timeout: 5000,
    });
    const d = res.data;
    return {
      temp: Math.round(d.main.temp),
      feelsLike: Math.round(d.main.feels_like),
      description: d.weather[0].description,
      icon: WEATHER_ICONS[d.weather[0].icon] ?? '🌤️',
      humidity: d.main.humidity,
      windSpeed: Math.round(d.wind.speed),
      city: 'Boston, MA',
    };
  }

  private _mockWeather() {
    const icons = ['☀️', '⛅', '🌦️', '❄️', '☁️'];
    const descs = ['Clear skies', 'Partly cloudy', 'Light rain', 'Overcast', 'Sunny intervals'];
    const temps = [28, 32, 45, 52, 61, 38, 44];
    const t = temps[new Date().getDay()];
    const i = new Date().getDay() % icons.length;
    return { temp: t, feelsLike: t - 3, description: descs[i], icon: icons[i], humidity: 62, windSpeed: 8, city: 'Boston, MA' };
  }

  private async _getTodayEvents() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return this.prisma.event.findMany({
      where: { startDate: { gte: start, lte: end }, status: 'PUBLISHED' },
      orderBy: { startDate: 'asc' },
      take: 5,
      select: {
        id: true, title: true, startDate: true, endDate: true,
        location: true, isNuOfficial: true, isVirtual: true,
      },
    });
  }

  private async _getUnreadMessageCount(userId: string) {
    return this.prisma.message.count({
      where: {
        NOT: { readBy: { has: userId } },
        senderId: { not: userId },
        conversation: {
          participants: { some: { userId } },
        },
      },
    });
  }

  private async _getUnreadNotificationCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  private async _getUpcomingRsvps(userId: string) {
    const now = new Date();
    const weekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.eventAttendee.findMany({
      where: {
        userId,
        event: { startDate: { gte: now, lte: weekOut }, status: 'PUBLISHED' },
      },
      take: 3,
      include: {
        event: { select: { id: true, title: true, startDate: true, location: true, isNuOfficial: true } },
      },
      orderBy: { event: { startDate: 'asc' } },
    });
  }

  private _greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }
}
