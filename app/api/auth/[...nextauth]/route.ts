import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Phase 1: Accept hardcoded admin credentials
        if (
          credentials?.username === "admin@planmatrix.local" &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          return {
            id: "admin",
            name: "Administrator",
            email: "admin@planmatrix.local",
            isITAdmin: true,
          };
        }
        return null;
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
