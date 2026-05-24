import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // ── Email helper ────────────────────────────────────────────────────────────

  private getMailTransport() {
    // In dev we use Ethereal (fake SMTP). In prod set SMTP_* env vars.
    if (process.env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
    // Fallback: log OTP to console (development)
    return null;
  }

  private async sendVerificationEmail(email: string, code: string) {
    const transport = this.getMailTransport();
    if (!transport) {
      // Dev mode: just log it
      console.log(`\n📧 VERIFICATION CODE for ${email}: ${code}\n`);
      return;
    }
    await transport.sendMail({
      from: `"HuskyMingle" <${process.env.SMTP_FROM || 'no-reply@huskymingle.app'}>`,
      to: email,
      subject: 'Your HuskyMingle verification code',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto">
          <h2 style="color:#8B0000">HuskyMingle 🐾</h2>
          <p>Your 6-digit verification code is:</p>
          <h1 style="letter-spacing:8px;color:#8B0000;font-size:40px">${code}</h1>
          <p>It expires in <strong>15 minutes</strong>.</p>
          <p style="color:#666;font-size:12px">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });
  }

  // ── Registration ────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    // 1. Domain gate
    const domain = dto.email.split('@')[1]?.toLowerCase();
    if (domain !== 'northeastern.edu') {
      throw new BadRequestException(
        'Only @northeastern.edu email addresses are allowed',
      );
    }

    // 2. Duplicate check
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      throw new ConflictException(
        existing.email === dto.email
          ? 'Email already registered'
          : 'Username already taken',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const { code, expiry } = this.generateOtp();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
        verified: false,
        verificationCode: code,
        verificationExpiry: expiry,
        profile: {
          create: {
            name: dto.name,
            university: dto.university ?? 'Northeastern University',
            major: dto.major,
          },
        },
      },
      include: { profile: true },
    });

    await this.sendVerificationEmail(dto.email, code);

    // Return minimal payload — no tokens yet (must verify first)
    return {
      message: 'Account created. Check your @northeastern.edu inbox for your verification code.',
      userId: user.id,
      email: user.email,
    };
  }

  // ── Verify email ────────────────────────────────────────────────────────────

  async verifyEmail(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new BadRequestException('User not found');
    if (user.verified) throw new BadRequestException('Email already verified');
    if (!user.verificationCode || !user.verificationExpiry) {
      throw new BadRequestException('No verification pending. Request a new code.');
    }
    if (new Date() > user.verificationExpiry) {
      throw new BadRequestException('Code expired. Request a new code.');
    }
    if (user.verificationCode !== code.trim()) {
      throw new BadRequestException('Invalid code');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        verified: true,
        verificationCode: null,
        verificationExpiry: null,
      },
      include: { profile: true },
    });

    const tokens = await this.generateTokens(updated.id, updated.email);
    await this.updateRefreshToken(updated.id, tokens.refreshToken);

    const { password, refreshToken, verificationCode, verificationExpiry, ...userResult } = updated;
    return { user: userResult, ...tokens };
  }

  // ── Resend OTP ───────────────────────────────────────────────────────────────

  async resendVerification(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (user.verified) throw new BadRequestException('Email already verified');

    const { code, expiry } = this.generateOtp();
    await this.prisma.user.update({
      where: { id: userId },
      data: { verificationCode: code, verificationExpiry: expiry },
    });
    await this.sendVerificationEmail(user.email, code);
    return { message: 'New code sent to your @northeastern.edu email.' };
  }

  // ── Login ────────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { profile: true },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.verified) {
      // Resend OTP automatically on login attempt
      const { code, expiry } = this.generateOtp();
      await this.prisma.user.update({
        where: { id: user.id },
        data: { verificationCode: code, verificationExpiry: expiry },
      });
      await this.sendVerificationEmail(user.email, code);
      throw new ForbiddenException({
        message: 'Email not verified. A new code has been sent.',
        userId: user.id,
        requiresVerification: true,
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    const { password, refreshToken, verificationCode, verificationExpiry, ...userResult } = user;
    return { user: userResult, ...tokens };
  }

  // ── Other ────────────────────────────────────────────────────────────────────

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  async refreshTokens(userId: string, rt: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const rtMatches = await bcrypt.compare(rt, user.refreshToken);
    if (!rtMatches) throw new UnauthorizedException('Access denied');

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new UnauthorizedException();
    const { password, refreshToken, verificationCode, verificationExpiry, ...result } = user;
    return result;
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private generateOtp(): { code: string; expiry: Date } {
    const code = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    return { code, expiry };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET || 'fallback-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }
}
