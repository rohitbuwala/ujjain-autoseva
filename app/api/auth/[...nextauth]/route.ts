import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

import connectDB from "@/lib/db";
import User from "@/models/User";

interface UserWithRole {
  id: string;
  role?: string;
}

type GoogleProfile = {
  email?: string;
  name?: string;
  sub?: string;
};

async function resolveGoogleUser(params: {
  email: string;
  name?: string | null;
  providerAccountId: string;
}) {
  const email = params.email.toLowerCase().trim();

  let mongoUser = await User.findOne({ email });

  if (!mongoUser) {
    const generatedPassword = await bcrypt.hash(
      randomBytes(32).toString("hex"),
      12
    );

    try {
      mongoUser = await User.create({
        name: params.name?.trim() || email.split("@")[0],
        email,
        password: generatedPassword,
        role: "user",
        verified: true,
        authProviders: [
          {
            provider: "google",
            providerAccountId: params.providerAccountId,
            providerEmail: email,
          },
        ],
      });
    } catch (error: unknown) {
      const isDuplicateKeyError =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code === 11000;

      if (!isDuplicateKeyError) {
        throw error;
      }

      mongoUser = await User.findOne({ email });

      if (!mongoUser) {
        throw error;
      }
    }
  }

  if (
    mongoUser &&
    !mongoUser.authProviders?.some(
      (provider: { provider?: string; providerAccountId?: string }) =>
        provider.provider === "google" &&
        provider.providerAccountId === params.providerAccountId
    )
  ) {
    await User.updateOne(
      { _id: mongoUser._id },
      {
        $addToSet: {
          authProviders: {
            provider: "google",
            providerAccountId: params.providerAccountId,
            providerEmail: email,
          },
        },
      }
    );
  }

  return mongoUser;
}


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
          return Promise.reject("MISSING_FIELDS");
        }


        const email = credentials.email.toLowerCase().trim();


        const user = await User.findOne({ email });


        if (!user) {
          return Promise.reject("EMAIL_NOT_FOUND");
        }


        const valid = await bcrypt.compare(
          credentials.password,
          user.password
        );


        if (!valid) {
          return Promise.reject("INVALID_PASSWORD");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role || "user",
        };
      },

    }),

  ],



  session: {
    strategy: "jwt",
  },



  callbacks: {

    async jwt({ token, user, account, profile }) {

      if (account?.provider === "google" && profile) {
        const googleProfile = profile as GoogleProfile;
        const email = googleProfile.email?.toLowerCase().trim();

        if (email) {
          await connectDB();

          const mongoUser = await resolveGoogleUser({
            email,
            name: googleProfile.name,
            providerAccountId: account.providerAccountId,
          });

          if (mongoUser) {
            token.id = mongoUser._id.toString();
            token.role = mongoUser.role || "user";
            return token;
          }
        }
      }

      if (user) {
        const extUser = user as UserWithRole;
        token.id = extUser.id;
        token.role = extUser.role || "";
      }

      return token;
    },


    async session({ session, token }) {

      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }

      return session;
    },


  },



  pages: {
    signIn: "/login",
    error: "/login",
  },


  secret: process.env.NEXTAUTH_SECRET,

};




const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
