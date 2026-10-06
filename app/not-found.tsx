import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page pb-20 pt-40 text-center">
      <h1 className="h1 mb-2">Page not found</h1>
      <Link href="/catalog" className="btn-primary mt-4">Go to catalog</Link>
    </div>
  );
}
