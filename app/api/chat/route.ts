import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { runChat } from "@/lib/ai/orchestrator";

const requestSchema = z.object({
  conversationId: z.string().optional().nullable(),
  message: z.string().min(1).max(2000),
});

const DAILY_LIMIT = 100;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "CUSTOMER") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

  // Basit günlük limit (anti-abuse)
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
  const used = await prisma.conversationMessage.count({
    where: {
      conversation: { userId: session.user.id },
      role: "USER",
      createdAt: { gte: dayAgo },
    },
  });
  if (used >= DAILY_LIMIT) {
    return NextResponse.json({ error: "Günlük mesaj limitine ulaştınız (100). Yarın tekrar deneyin." }, { status: 429 });
  }

  const result = await runChat({
    customerId: session.user.id,
    conversationId: parsed.data.conversationId ?? null,
    userMessage: parsed.data.message,
  });
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "CUSTOMER") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("conversationId");

  const convo = id
    ? await prisma.conversation.findFirst({
        where: { id, userId: session.user.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : await prisma.conversation.findFirst({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

  if (!convo) return NextResponse.json({ conversationId: null, messages: [] });
  return NextResponse.json({
    conversationId: convo.id,
    messages: convo.messages.map((m) => ({
      role: m.role.toLowerCase(),
      content: m.content,
      toolName: m.toolName,
    })),
  });
}
