'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export default function AuthButton() {
  const { status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return (
    <button
      className="button-secondary"
      onClick={() => (isAuthenticated ? signOut() : signIn('google'))}
    >
      {isAuthenticated ? 'Sign out' : 'Sign in'}
    </button>
  );
}
