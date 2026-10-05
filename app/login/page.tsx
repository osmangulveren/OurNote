import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-8">
        <h1 className="h1 mb-1">Log in</h1>
        <p className="muted mb-6">Access wholesale prices, orders and truck tracking.</p>
        <LoginForm next={next} />
        <p className="muted mt-6 text-center">
          No account yet? <Link href="/register" className="font-semibold text-brand-600">Open a trade account</Link>
        </p>
      </div>
    </div>
  );
}
