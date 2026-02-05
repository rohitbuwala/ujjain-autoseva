import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/db";
import User from "@/models/User";

const ADMIN_EMAIL = "admin@gmail.com";

export const authOptions: NextAuthOptions = {
  providers: [

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",

      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {

        await connectDB();

        if (!credentials?.email || !credentials.password) {
          throw new Error("Missing fields");
        }

        const user = await User.findOne({
          email: credentials.email,
        });

        if (!user) {
          throw new Error("No user found");
        }

        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isMatch) {
          throw new Error("Wrong password");
        }

        const isAdmin = user.email === ADMIN_EMAIL;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: isAdmin ? "admin" : "user",
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {

    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },

  },

  secret: process.env.NEXTAUTH_SECRET,

  pages: {
    signIn: "/login",
  },
};


const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
