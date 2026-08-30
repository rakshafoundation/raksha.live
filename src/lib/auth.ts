import type { AuthOptions, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { UserRoleName, VerificationTier } from '@prisma/client';
import { db } from './db';

/**
 * Auth scaffold (build order §10 step 5).
 *
 * Real Tier 1 verification is social login (Google/Facebook/Instagram/
 * Apple) + OTP-verified phone + an ID document check — see the build
 * brief §2/§5a. Google is wired below; Facebook/Instagram/Apple follow
 * the same NextAuth provider pattern once credentials are available.
 * Phone OTP (MSG91/Twilio Verify) is not wired yet — profile completion
 * (phone OTP + ID doc) should be enforced as a post-login step before a
 * user can create a case, not inside this file.
 *
 * ENABLE_DEV_LOGIN adds a Credentials provider (phone + name only, no
 * password) purely so the report flow, rescuer view, etc. are testable
 * without live OAuth/OTP providers configured. It must be OFF in
 * production (see .env.example) and is never a substitute for the real
 * verification flow.
 */

async function findOrCreateUserByPhone(phone: string, name: string) {
  const existing = await db.user.findUnique({ where: { phone } });
  if (existing) return existing;
  return db.user.create({
    data: {
      phone,
      name,
      phoneVerifiedAt: new Date(),
      verificationTier: VerificationTier.NONE,
      roles: { create: [{ role: UserRoleName.REPORTER }] },
    },
  });
}

const providers: AuthOptions['providers'] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.ENABLE_DEV_LOGIN === 'true') {
  providers.push(
    CredentialsProvider({
      id: 'dev-login',
      name: 'Dev login (phone only, no OTP — non-production)',
      credentials: {
        phone: { label: 'Phone', type: 'text' },
        name: { label: 'Name', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone) return null;
        const user = await findOrCreateUserByPhone(
          credentials.phone,
          credentials.name || 'Reporter'
        );
        return { id: user.id, name: user.name, email: user.email ?? undefined };
      },
    })
  );
}

export const authOptions: AuthOptions = {
  providers,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
      }
      if (token.userId) {
        const dbUser = await db.user.findUnique({
          where: { id: token.userId as string },
          include: { roles: true },
        });
        if (dbUser) {
          token.roles = dbUser.roles.map((r) => r.role);
          token.verificationTier = dbUser.verificationTier;
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.roles = (token.roles as UserRoleName[]) ?? [];
        session.user.verificationTier =
          (token.verificationTier as VerificationTier) ?? VerificationTier.NONE;
      }
      return session;
    },
  },
};
