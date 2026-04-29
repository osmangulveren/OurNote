import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { CartStateItem } from '@/lib/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { address: string; name: string; items: CartStateItem[] };
  const totalPrice = body.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      items: body.items,
      address: { name: body.name, address: body.address },
      totalPrice,
      status: 'pending'
    }
  });

  return NextResponse.json({ orderId: order.id });
}
