import LoginForm from "./LoginForm";

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold mb-1">B2B Tedarik Portalı</h1>
        <p className="text-sm text-slate-500 mb-6">Hesabınızla giriş yapın.</p>
        <LoginForm next={searchParams.next} />
        <div className="mt-6 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-600">Demo hesaplar</p>
          <p>Admin: <code>admin@example.com</code> / <code>admin123</code></p>
          <p>Müşteri: <code>musteri1@example.com</code> / <code>customer123</code></p>
          <p>Müşteri: <code>musteri2@example.com</code> / <code>customer123</code></p>
        </div>
      </div>
    </main>
  );
}
