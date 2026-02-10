import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";
import User from "@/model/userModel";
import { verifyPassword } from "@/lib/password";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString();

        if (!email || !password) return null;

        await dbConnect();
        const user = await User.findOne({ email }).select("+password");
        if (!user?.password) return null;

        const valid = await verifyPassword(password, user.password);
        if (!valid) return null;

        return {
          id: (user as any)._id.toString(),
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
          image: user.profilePicture,
        };
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      if (account?.provider === "credentials") {
        return true;
      }

      try {
        await dbConnect();
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          await User.create({
            email: user.email,
            firstName: user.name?.split(" ")[0] || "User",
            lastName: user.name?.split(" ").slice(1).join(" ") || "User",
            profilePicture: user.image,
            oauthProviders: [
              {
                provider: account?.provider || "unknown",
                providerId: account?.providerAccountId || "unknown",
              },
            ],
            isEmailVerified: true,
            role: "user",
          });
        }
        return true;
      } catch (error) {
        console.error("Error saving user to DB:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          await dbConnect();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.id = (dbUser as any)._id.toString();
            token.role = dbUser.role;
          }
        } catch (error) {
          console.error("Error fetching user for JWT:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});
