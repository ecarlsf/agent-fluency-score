import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email!;
        const existing = await prisma.user.findUnique({ where: { email } });

        if (!existing) {
          const org = await prisma.organization.create({
            data: { name: `${user.name || email.split("@")[0]}'s Team` },
          });
          const created = await prisma.user.create({
            data: {
              name: user.name || email.split("@")[0],
              email,
              orgId: org.id,
            },
          });
          user.id = String(created.id);
        } else {
          user.id = String(existing.id);
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      // Look up orgId and orgName from the database on sign-in or when missing
      if ((user || account) && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          include: { org: { select: { name: true } } },
        });
        if (dbUser) {
          token.id = String(dbUser.id);
          token.orgId = dbUser.orgId;
          token.orgName = dbUser.org?.name ?? null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.orgId = token.orgId;
        session.user.orgName = token.orgName;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
