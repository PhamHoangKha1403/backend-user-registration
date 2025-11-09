import { Controller, Post, Body, ValidationPipe, UsePipes, HttpCode } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

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
}