import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import connectDB from "@/lib/db";
import User from "@/models/User";



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

    async jwt({ token, user }) {

      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
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
