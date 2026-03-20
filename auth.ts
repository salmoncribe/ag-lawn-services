import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { formatDisplayName } from "@/lib/utils";

const credentialsSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
});

const allowedUsers = new Set(["billy", "josh"]);

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET ?? "replace-this-in-production",
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30
  },
  providers: [
    Credentials({
      credentials: {
        username: {
          label: "Username",
          type: "text"
        },
        password: {
          label: "Password",
          type: "password"
        }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const username = parsed.data.username.toLowerCase();

        if (!allowedUsers.has(username)) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { username }
        });

        if (!user) {
          return null;
        }

        const passwordMatches = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          username: user.username,
          name: formatDisplayName(user.username)
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }

      return token;
    },
    async session({ session, token }) {
      const tokenId = typeof token.id === "string" ? token.id : null;
      const tokenUsername =
        typeof token.username === "string" ? token.username : null;

      if (session.user && tokenId && tokenUsername) {
        session.user.id = tokenId;
        session.user.username = tokenUsername;
        session.user.name = formatDisplayName(tokenUsername);
      }

      return session;
    }
  }
});
