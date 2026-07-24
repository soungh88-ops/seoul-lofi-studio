import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const allowedEmailsEnv = process.env.ALLOWED_EMAILS || "";
      const allowedEmails = allowedEmailsEnv.split(",").map(e => e.trim().toLowerCase());
      
      if (user.email && allowedEmails.includes(user.email.toLowerCase())) {
        return true;
      }
      console.warn(`[Access Denied] Google login rejected for email: ${user.email}`);
      return false; // Blocks signIn and redirects with AccessDenied error query param
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
});

export { handler as GET, handler as POST };
