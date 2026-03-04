import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

// Admin olacak e-posta adresleri (env var + sabit liste)
function getAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAIL ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  // Sabit fallback — Vercel'e env var eklenmeden de çalışır
  const hardcoded = ['petoylama@gmail.com', 'ekremselcuk@gmail.com'];
  return Array.from(new Set([...fromEnv, ...hardcoded]));
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email ve şifre gerekli');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user?.password) {
          throw new Error('Kullanıcı bulunamadı');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Hatalı şifre');
        }

        return {
          id: user.id,
          email: user.email ?? '',
          name: user.name,
          image: user.image,
          isAdmin: user.isAdmin,
          points: user.points,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Admin e-posta adreslerini DB'de isAdmin=true olarak işaretle
      const email = user.email?.toLowerCase() ?? '';
      if (email && getAdminEmails().includes(email)) {
        try {
          await prisma.user.updateMany({
            where: { email: user.email! },
            data: { isAdmin: true },
          });
        } catch {
          // DB güncellemesi başarısız olsa bile girişe izin ver
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.isAdmin = (user as any).isAdmin ?? false;
        token.points = (user as any).points ?? 100;
      }

      // ADMIN_EMAIL kontrolü (env var + hardcoded liste)
      const email = (token.email as string | null | undefined)?.toLowerCase() ?? '';
      if (email && getAdminEmails().includes(email)) {
        token.isAdmin = true;
      }

      // Update token when session is updated
      if (trigger === 'update' && session) {
        token.points = session.points;
      }

      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.points = token.points as number;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  cookies: {
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
