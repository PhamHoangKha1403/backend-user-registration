import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module'; 
import { PassportModule } from '@nestjs/passport'; 
import { JwtModule } from '@nestjs/jwt'; 
import type { JwtSignOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; 
import { JwtStrategy } from './jwt.strategy'; 

@Module({
  imports: [
    // 5. Import UsersModule để dùng UsersService
    UsersModule,
    // 6. Đăng ký Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // 7. Đăng ký JwtModule (cấu hình động)
    JwtModule.registerAsync({
      imports: [ConfigModule], // Phải import ConfigModule
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not set');
        }

        const toExpiresIn = (
          value: string | undefined,
          fallback: string,
        ): JwtSignOptions['expiresIn'] => (value ?? fallback) as JwtSignOptions['expiresIn'];

        return {
          secret,
          signOptions: {
            expiresIn: toExpiresIn(
              configService.get<string>('JWT_EXPIRATION_TIME'),
              '15m',
            ),
          },
        };
      },
      inject: [ConfigService], 
    }),
  ],
  providers: [AuthService, JwtStrategy], 
  controllers: [AuthController],
})
export class AuthModule {}