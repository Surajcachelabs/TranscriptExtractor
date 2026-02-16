import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

async function refreshAccessToken(token: any) {
  try {
    const refreshToken = token.refreshToken;
    if (!refreshToken) {
      return { ...token, error: 'NoRefreshToken' };
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      return { ...token, error: 'RefreshAccessTokenError' };
    }

    const data = await res.json();
    const expiresAt = data.expires_in ? Date.now() + data.expires_in * 1000 : undefined;

    return {
      ...token,
      accessToken: data.access_token ?? token.accessToken,
      expiresAt,
      // keep the same refresh token unless Google returns a new one
      refreshToken: data.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (err) {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

// NextAuth configuration to request Google Drive read-only scope and surface tokens in JWT/session.
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive.readonly',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign-in
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token ?? token.refreshToken;
        token.expiresAt = account.expires_at ? account.expires_at * 1000 : undefined;
        return token;
      }

      // If token not expired, return it
      const expiresAt = typeof token.expiresAt === 'number' ? token.expiresAt : undefined;

      if (expiresAt && Date.now() < expiresAt - 60_000) {
        return token;
      }

      // Try to refresh
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      // Expose tokens to the client & server components consuming the session.
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      session.expiresAt = token.expiresAt as number | undefined;
      // Surface refresh errors to the client if needed
      // @ts-expect-error
      session.error = token.error as string | undefined;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default authOptions;
