import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/onboarding'
  },
  providers: [
    Credentials({
      credentials: {
        phone: {},
        otp: {}
      },
      authorize: async (credentials) => {
        const phone = String(credentials.phone ?? '').trim();
        const otp = String(credentials.otp ?? '').trim();

        if (!phone || otp !== '123456') {
          return null;
        }

        console.log(`[Mock OTP] ${phone} => 123456`);

        const user = await prisma.user.upsert({
          where: { phone },
          create: { phone, addresses: JSON.stringify([]) },
          update: {}
        });

        return { id: user.id, name: user.name ?? user.phone, phone: user.phone };
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.phone = user.phone;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = String(token.sub);
        session.user.phone = String(token.phone ?? '');
      }
      return session;
    }
  }
});
