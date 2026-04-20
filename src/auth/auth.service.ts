import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user-entity';
import { Repository } from 'typeorm';
import { RegisterDto } from './dtos/register.dto';
import bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  private hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  private verifyPassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private generateAccessToken(user: User) {
    // email,id,role ->RBAC
    const payload = {
      email: user.email,
      id: user.id,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: 'jwtsecret',
      expiresIn: '15m',
    });
  }

  private generateRefreshToken(user: User) {
    // email,id,role ->RBAC
    const payload = {
      id: user.id,
    };

    return this.jwtService.sign(payload, {
      secret: 'refreshsecret',
      expiresIn: '7d',
    });
  }

  private generateTokens(user: User) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
    };
  }

  async refreshToken(refreshToken: string) {
    const payload = this.jwtService.verify<{ id: number }>(refreshToken, {
      secret: 'refreshsecret',
    });

    const user = await this.userRepo.findOne({ where: { id: payload.id } });

    if (!user) {
      throw new UnauthorizedException('invalid token');
    }

    const accessToken = this.generateAccessToken(user);

    return { accessToken };
  }

  async createAdmin(registerDto: RegisterDto) {
    const existingUser = await this.userRepo.findOneBy({
      email: registerDto.email,
    });
    if (existingUser) {
      throw new ConflictException(
        'email already in use. Please try with a different email',
      );
    }
    const hashedPassword = await this.hashPassword(registerDto.password);

    const newlyCreatedUser = this.userRepo.create({
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    const savedUser = await this.userRepo.save(newlyCreatedUser);

    const { password, ...result } = savedUser;

    return {
      user: result,
      message: 'Admin user created successfully! Please login to continue',
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepo.findOneBy({
      email: registerDto.email,
    });
    if (existingUser) {
      throw new ConflictException(
        'email already in use. Please try with a different email',
      );
    }
    const hashedPassword = await this.hashPassword(registerDto.password);

    const newlyCreatedUser = this.userRepo.create({
      email: registerDto.email,
      name: registerDto.name,
      password: hashedPassword,
      role: UserRole.USER,
    });

    const savedUser = await this.userRepo.save(newlyCreatedUser);
    const tokens = this.generateTokens(savedUser);

    const { password, ...result } = savedUser;

    return {
      user: result,
      ...tokens,
      message: 'Registration successfully! Please login to continue',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: loginDto.email },
    });

    if (
      !user ||
      !(await this.verifyPassword(loginDto.password, user.password))
    ) {
      throw new UnauthorizedException(
        'Inavlid credentials or account not exists',
      );
    }

    //generate jwt token
    const tokens = this.generateTokens(user);
    const { password, ...result } = user;

    return {
      user: result,
      ...tokens,
    };
  }

  async getUserById(id: number) {
    const user = await this.userRepo.findOneBy({ id });

    if (!user) {
      throw new UnauthorizedException('user not found');
    }

    const { password, ...result } = user;
    return result;
  }
}
