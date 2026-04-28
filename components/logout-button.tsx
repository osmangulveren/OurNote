'use client';

import { signOut } from 'next-auth/react';

export function LogoutButton(): JSX.Element {
  return (
    <button onClick={() => signOut({ callbackUrl: '/onboarding' })} className="rounded-xl border border-zinc-300 px-4 py-2 text-sm">
      Çıkış Yap
    </button>
  );
}
