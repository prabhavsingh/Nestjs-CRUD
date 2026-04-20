import { Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const email = (req.body as { email?: string })?.email || 'anonymous';

    return `login=${email}`;
  }

  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      'Too many attempts. Please try again after 1 minute',
    );
  }
}
