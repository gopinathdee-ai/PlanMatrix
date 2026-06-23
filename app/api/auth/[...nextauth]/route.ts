import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const { db } = await import("@/lib/db");
          const user = await db("users").where("email", credentials.username).first();

          if (!user) {
            return null;
          }

          if (!user.password_hash) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash);

          if (!passwordMatch) {
            return null;
          }

          return {
            id: String(user.id),
            name: user.name,
            email: user.email,
            isITAdmin: user.is_it_admin || false,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isITAdmin = user.isITAdmin || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isITAdmin = token.isITAdmin;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
