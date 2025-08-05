import { UserRole } from '@prisma/client';
import 'next-auth';

declare module 'next-auth' {
  interface User {
    role: UserRole;
    isMember: boolean;
    memberSince: Date | null;
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      isMember: boolean;
      memberSince: Date | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole;
    isMember: boolean;
    memberSince: Date | null;
  }
}
