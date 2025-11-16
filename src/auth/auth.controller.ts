import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Controller('auth') // /auth/login và /auth/refresh
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Endpoint /auth/login
   */
  @Post('login')
  async login(@Body() loginDto: CreateUserDto) {
    // 1. Xác thực
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // 2. Cấp token
    return this.authService.login(user);
  }

  /**
   * Endpoint /auth/refresh
   */
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token không được gửi');
    }
    return this.authService.refreshTokens(refreshToken);
  }
}