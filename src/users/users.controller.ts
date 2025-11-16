import { Controller, Post, Body, UsePipes, HttpCode, ValidationPipe, Get, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @HttpCode(201)
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(@Body() createUserDto: CreateUserDto) {

      const user = await this.usersService.register(createUserDto);
      return { message: 'User registered successfully', userId: user._id };
   
      // Khi service ném ConflictException, NestJS sẽ tự động bắt
  }
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req) {
    const user = await this.usersService.findOneByEmail(req.user.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userObject = user.toObject();

    return {
      _id: user.id,
      email: user.email,
      name: userObject.name ?? null,
      createdAt: user.createdAt,
    };
  }
}