import type { UserRoleName, VerificationTier } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: UserRoleName[];
      verificationTier: VerificationTier;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
