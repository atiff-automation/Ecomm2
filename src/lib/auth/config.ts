import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { UserRole, UserStatus } from '@prisma/client';
import {
  getCachedUserValidation,
  setCachedUserValidation,
  getCachedSessionData,
  setCachedSessionData
} from './cache';

export const authOptions: NextAuthOptions = {
  // Remove PrismaAdapter when using JWT strategy to avoid conflicts
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          return null;
        }

        // Check if user account is active
        if (user.status !== UserStatus.ACTIVE) {
          throw new Error('Account is not active. Please contact support.');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Update last login time
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          isMember: user.isMember,
          memberSince: user.memberSince,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.isMember = user.isMember;
        token.memberSince = user.memberSince;
      }

      // Validate that user still exists in database (prevents stale tokens)
      if (token.sub) {
        // Check cache first to avoid database query
        const cachedValid = getCachedUserValidation(token.sub);

        if (cachedValid !== undefined) {
          if (!cachedValid) {
            console.warn(`Cached invalid user: ${token.sub}`);
            return {};
          }

          // Use cached session data if available and not forcing update
          const cachedData = getCachedSessionData(token.sub);
          if (cachedData && trigger !== 'update') {
            token.role = cachedData.role as any;
            token.isMember = cachedData.isMember;
            token.memberSince = cachedData.memberSince;
            return token;
          }
        }

        // Cache miss - query database
        const userExists = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { id: true, role: true, isMember: true, memberSince: true, status: true },
        });

        if (!userExists || userExists.status !== UserStatus.ACTIVE) {
          // Cache invalid user to prevent repeated DB queries
          setCachedUserValidation(token.sub, false);
          console.warn(`Token validation failed for user ${token.sub}: ${!userExists ? 'User not found' : 'User not active'}`);
          return {};
        }

        // Cache valid user and session data
        setCachedUserValidation(token.sub, true);
        setCachedSessionData(token.sub, {
          role: userExists.role,
          isMember: userExists.isMember,
          memberSince: userExists.memberSince,
          status: userExists.status,
        });

        // Refresh user data when session.update() is called or validate current data
        if (trigger === 'update' || !token.role) {
          token.role = userExists.role;
          token.isMember = userExists.isMember;
          token.memberSince = userExists.memberSince;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && token.sub && token.role) {
        session.user.id = token.sub;
        session.user.role = token.role as UserRole;
        session.user.isMember = token.isMember as boolean;
        session.user.memberSince = token.memberSince as Date | null;
        return session;
      }

      // Return null if token is invalid to force re-authentication
      return null;
    },
    async redirect({ url, baseUrl }) {
      // Role-based redirects are handled in the signin page

      // Allows relative callback URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET!,
};
