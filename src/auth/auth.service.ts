import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/users.schema';

@Injectable()
export class AuthService {
  private readonly defaultAccessTokenTtl = '15m';
  private readonly defaultRefreshTokenTtl = '7d';

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private normalizeId(id: string | { toString(): string }): string {
    return typeof id === 'string' ? id : id.toString();
  }

  private ensureValidId(id: unknown): string | { toString(): string } {
    if (typeof id === 'string') {
      return id;
    }

    if (id && typeof (id as { toString(): string }).toString === 'function') {
      return id as { toString(): string };
    }

    throw new Error('Invalid user identifier');
  }

  private getSecret(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`${key} is not set`);
    }
    return value;
  }

  private getExpiresIn(
    key: string,
    fallback: string,
  ): JwtSignOptions['expiresIn'] {
    const value = this.configService.get<string>(key);
    return (value ?? fallback) as JwtSignOptions['expiresIn'];
  }

  private buildAuthenticatedUser(user: User): AuthenticatedUser {
    const userObject = user.toObject();
    const { password, ...rest } = userObject;
    const identifier = this.ensureValidId(user._id);
    return {
      ...rest,
      _id: identifier,
      email: (rest.email as string) ?? user.email,
    };
  }

  /**
   * 1. Xác thực user (cho /login)
   */
  async validateUser(
    email: string,
    pass: string,
  ): Promise<AuthenticatedUser | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      return null;
    }

    // Trả về user 
    return this.buildAuthenticatedUser(user);
  }

  /**
   * 2. Tạo Access Token và Refresh Token 
   */
  async createTokens(user: AuthenticatedUser) {
    const payload = {
      email: user.email,
      sub: this.normalizeId(user._id),
    };

    const [accessToken, refreshToken] = await Promise.all([
      // Tạo Access Token
      this.jwtService.signAsync(payload, {
        secret: this.getSecret('JWT_SECRET'),
        expiresIn: this.getExpiresIn(
          'JWT_EXPIRATION_TIME',
          this.defaultAccessTokenTtl,
        ),
      }),
      // Tạo Refresh Token
      this.jwtService.signAsync(payload, {
        secret: this.getSecret('JWT_REFRESH_SECRET'),
        expiresIn: this.getExpiresIn(
          'JWT_REFRESH_EXPIRATION_TIME',
          this.defaultRefreshTokenTtl,
        ),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * 3. Xử lý Login 
   */
  async login(user: AuthenticatedUser) {
    const tokens = await this.createTokens(user);
    const { name, email } = user;
    return {
      user: { id: this.normalizeId(user._id), name, email },
      ...tokens,
    };
  }

  /**
   * 4. Xử lý Refresh Token (cho /refresh)
   */
  async refreshTokens(refreshToken: string) {
    try {
      // 1. Xác thực Refresh Token
      const payload = await this.jwtService.verifyAsync<{ email: string }>(
        refreshToken,
        {
          secret: this.getSecret('JWT_REFRESH_SECRET'),
        },
      );

      // 2. Lấy thông tin user từ payload
      const user = await this.usersService.findOneByEmail(payload.email);
      if (!user) {
        throw new UnauthorizedException('User không còn tồn tại');
      }

      // 3. Tạo 1 cặp token mới
      return this.createTokens(this.buildAuthenticatedUser(user));

    } catch (e) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }
}

type AuthenticatedUser = {
  _id: string | { toString(): string };
  email: string;
  name?: string;
  [key: string]: unknown;
};