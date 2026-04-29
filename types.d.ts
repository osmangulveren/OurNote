import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      phone: string;
      name?: string | null;
    };
  }

  interface User {
    phone: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    phone?: string;
  }
}
