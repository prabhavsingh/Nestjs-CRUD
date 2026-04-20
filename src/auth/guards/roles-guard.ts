import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/role.decorator';
import { User, UserRole } from '../entities/user-entity';
import { Request } from 'express';

@Injectable()
export class RolesGuard implements CanActivate {
  //reflector -> utility that will help to access Metadata

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    console.log('rolee', requiredRoles);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user: User }>();

    console.log('userrr', user);

    if (!user) {
      throw new ForbiddenException('user not authenticated');
    }

    const hasRequiredRole = requiredRoles.some((role) => user.role === role);
    if (!hasRequiredRole) {
      throw new ForbiddenException('insufficient permission');
    }
    return true;
  }
}
