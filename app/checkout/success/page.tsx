import Link from 'next/link';

type Props = {
  searchParams: { orderId?: string };
};

export default function SuccessPage({ searchParams }: Props): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">Sipariş alındı 🎉</h1>
      <p>Sipariş numaranız: {searchParams.orderId}</p>
      <Link href="/profile" className="rounded-xl bg-brand px-5 py-3 text-white">
        Profile Git
      </Link>
    </div>
  );
}
