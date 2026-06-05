import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { manualLoginRequestSchema } from "@/lib/api/validation";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

function getEnv(firstName: string, fallbackName?: string) {
  return process.env[firstName] || (fallbackName ? process.env[fallbackName] : undefined);
}

function getProviders() {
  const providers: NextAuthOptions["providers"] = [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = manualLoginRequestSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValidPassword = await verifyPassword(parsed.data.password, user.passwordHash);

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ];
  const googleClientId = getEnv("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID");
  const googleClientSecret = getEnv("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET");
  const githubClientId = getEnv("AUTH_GITHUB_ID", "GITHUB_ID");
  const githubClientSecret = getEnv("AUTH_GITHUB_SECRET", "GITHUB_SECRET");

  if (googleClientId && googleClientSecret) {
    providers.push(
      GoogleProvider({
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      }),
    );
  }

  if (githubClientId && githubClientSecret) {
    providers.push(
      GitHubProvider({
        clientId: githubClientId,
        clientSecret: githubClientSecret,
      }),
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: getProviders(),
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      return Boolean(user.email);
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
};
