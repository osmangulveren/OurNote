import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { formatTRY } from '@/lib/data';
import { LogoutButton } from '@/components/logout-button';

export default async function ProfilePage(): Promise<JSX.Element> {
  const session = await auth();

  const orders = await prisma.order.findMany({
    where: { userId: session?.user.id },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-4 pb-6">
      <h2 className="text-xl font-bold">Profil</h2>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm text-zinc-500">Telefon</p>
        <p className="font-semibold">{session?.user.phone}</p>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="font-semibold">Sipariş Geçmişi</h3>
        <div className="mt-2 space-y-2">
          {orders.length === 0 ? <p className="text-sm text-zinc-500">Henüz sipariş yok.</p> : null}
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-zinc-200 p-3 text-sm">
              <p className="font-medium">Sipariş #{order.id.slice(-6)}</p>
              <p className="text-zinc-500">{new Date(order.createdAt).toLocaleString('tr-TR')}</p>
              <p className="font-semibold">{formatTRY(order.totalPrice)}</p>
            </div>
          ))}
        </div>
      </div>
      <LogoutButton />
    </div>
  );
}
