import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User, UserRole } from './entities/user-entity';
import { Roles } from './decorators/role.decorator';
import { RolesGuard } from './guards/roles-guard';
import { LoginThrottleGuard } from './guards/login-throttler.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LoginThrottleGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  //protected route
  //current user route

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: Omit<User, 'password'>) {
    return user;
  }

  //protected route
  //current user is Admin
  // create admin route

  @Post('create-admin')
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  createAdmin(@Body() registerDto: RegisterDto) {
    return this.authService.createAdmin(registerDto);
  }
}
