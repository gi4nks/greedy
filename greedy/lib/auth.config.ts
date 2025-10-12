import type { NextAuthConfig } from 'next-auth';
import NextAuth from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [
    // For now, we'll use a simple credentials provider
    // In production, you might want to add OAuth providers like Google, GitHub, etc.
    {
      id: 'credentials',
      name: 'credentials',
      type: 'credentials',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // For demo purposes, we'll use a simple password check
        // In production, implement proper user authentication
        const { password } = credentials as { password: string };

        // Simple password check - replace with proper authentication
        if (password === process.env.ADMIN_PASSWORD || process.env.NODE_ENV === 'development') {
          return {
            id: 'admin',
            name: 'Admin',
            email: 'admin@greedy.app',
          };
        }

        return null;
      },
    },
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }

      if (isLoggedIn) {
        return Response.redirect(new URL('/', nextUrl));
      }

      return true;
    },
  },
};

export const { auth } = NextAuth(authConfig);