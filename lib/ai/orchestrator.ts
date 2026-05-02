import { ChatMessageRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AssistantProvider } from "./provider";
import { RuleBasedProvider } from "./providers/ruleBased";
import { GeminiProvider } from "./providers/gemini";
import { ClaudeProvider } from "./providers/claude";
import { getKnowledgeBase } from "./knowledgeBase";
import { TOOL_DEFS, executeTool } from "./tools";
import type { ChatMessage, ToolName } from "./types";

const SYSTEM_PROMPT = `Sen Rosadore Home'un B2B müşteri asistanısın.

Görevin: müşterinin sorularını yanıtlamak, ürün önermek, sepet/sipariş işlemlerinde yardımcı olmak.

Kurallar:
- Yalnızca aşağıdaki ürün kataloğu ve müşterinin sipariş geçmişi hakkında konuş.
- Genel sohbet, politik konular, başka markalar veya app dışı bilgilerle ilgili soruları kibarca reddet.
- Fiyatları "size özel" olarak müşteriye iletilen değer üzerinden ver (kataloğda görüldüğü gibi).
- Sipariş veya sepete ekleme gibi yan etkili işlemleri yapmadan önce müşterinin onayını al.
- Kısa ve net cevap ver; tablolar yerine madde işareti kullan.
- Türkçe cevap ver.`;

export function selectProvider(): AssistantProvider {
  const choice = (process.env.AI_PROVIDER ?? "auto").toLowerCase();
  if (choice === "claude") return new ClaudeProvider();
  if (choice === "gemini") return new GeminiProvider();
  if (choice === "rule-based") return new RuleBasedProvider();
  // auto: anahtar varsa Claude > Gemini, yoksa rule-based
  if (process.env.ANTHROPIC_API_KEY) return new ClaudeProvider();
  if (process.env.GEMINI_API_KEY) return new GeminiProvider();
  return new RuleBasedProvider();
}

export interface RunChatArgs {
  customerId: string;
  conversationId?: string | null;
  userMessage: string;
}

export interface RunChatResult {
  conversationId: string;
  messages: ChatMessage[];
  providerId: string;
}

/**
 * Tek bir kullanıcı turunu yürütür:
 *  1. Conversation'ı (yoksa) açar; user mesajını DB'ye yazar
 *  2. Provider'a sorar → reply + toolCalls
 *  3. Tool çağrılarını dispatch eder, sonuçları kaydeder
 *  4. Tool sonuçları varsa provider'a tekrar sorar (tek tur follow-up)
 *  5. Tüm yeni mesajları döner
 */
export async function runChat(args: RunChatArgs): Promise<RunChatResult> {
  const provider = selectProvider();
  const knowledge = await getKnowledgeBase().buildSnapshot(args.customerId);

  const conversation = args.conversationId
    ? await prisma.conversation.findFirst({
        where: { id: args.conversationId, userId: args.customerId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : null;

  let convoId: string;
  let history: ChatMessage[];
  if (conversation) {
    convoId = conversation.id;
    history = conversation.messages.map(rowToMessage);
  } else {
    const created = await prisma.conversation.create({ data: { userId: args.customerId } });
    convoId = created.id;
    history = [];
  }

  // Yeni user mesajı kaydet
  await prisma.conversationMessage.create({
    data: { conversationId: convoId, role: ChatMessageRole.USER, content: args.userMessage },
  });
  history.push({ role: "user", content: args.userMessage });

  const systemPrompt = `${SYSTEM_PROMPT}

Müşteri: ${knowledge.customerName}${knowledge.companyName ? ` (${knowledge.companyName})` : ""}
İskonto: %${knowledge.discountPercentage}

KATALOG:
${knowledge.productSummary}`;

  const turn = await provider.ask({
    systemPrompt,
    messages: history,
    tools: TOOL_DEFS,
    knowledge,
  });

  const newMessages: ChatMessage[] = [];

  // Asistanın ilk cevabı (eğer içerik varsa)
  if (turn.reply) {
    await prisma.conversationMessage.create({
      data: { conversationId: convoId, role: ChatMessageRole.ASSISTANT, content: turn.reply },
    });
    newMessages.push({ role: "assistant", content: turn.reply });
  }

  // Tool çağrıları
  if (turn.toolCalls && turn.toolCalls.length > 0) {
    for (const call of turn.toolCalls) {
      const result = await executeTool({ customerId: args.customerId }, call.name as ToolName, call.args);
      const summary = summarizeToolResult(call.name as ToolName, result);

      await prisma.conversationMessage.create({
        data: {
          conversationId: convoId,
          role: ChatMessageRole.TOOL,
          content: summary,
          toolName: call.name,
          toolArgs: call.args as any,
          toolResult: result as any,
        },
      });

      newMessages.push({
        role: "tool",
        content: summary,
        toolName: call.name,
        toolArgs: call.args,
        toolResult: result,
      });
    }

    // Provider tool sonuçlarını görmek isteyebilir → ikinci tur
    // Rule-based provider için ekstra çağrı yapmıyoruz (özet zaten yeterli);
    // gerçek LLM bağlandığında burası ikinci ask() çağrısına dönüşür.
    if (provider.id !== "rule-based") {
      const followUpHistory: ChatMessage[] = [...history, ...newMessages];
      const followUp = await provider.ask({
        systemPrompt,
        messages: followUpHistory,
        tools: TOOL_DEFS,
        knowledge,
      });
      if (followUp.reply) {
        await prisma.conversationMessage.create({
          data: { conversationId: convoId, role: ChatMessageRole.ASSISTANT, content: followUp.reply },
        });
        newMessages.push({ role: "assistant", content: followUp.reply });
      }
    }
  }

  await prisma.conversation.update({ where: { id: convoId }, data: { updatedAt: new Date() } });

  return { conversationId: convoId, messages: newMessages, providerId: provider.id };
}

function rowToMessage(row: { role: ChatMessageRole; content: string; toolName: string | null; toolArgs: any; toolResult: any }): ChatMessage {
  return {
    role: row.role.toLowerCase() as ChatMessage["role"],
    content: row.content,
    toolName: row.toolName ?? undefined,
    toolArgs: row.toolArgs ?? undefined,
    toolResult: row.toolResult ?? undefined,
  };
}

function summarizeToolResult(name: ToolName, result: any): string {
  if (!result?.ok) return `❌ ${name}: ${result?.error ?? "hata"}`;
  switch (name) {
    case "search_products": {
      const r = result.data;
      if (r.count === 0) return "Eşleşen ürün bulunamadı.";
      return r.results
        .map((p: any) => `• [${p.sku}] ${p.name} — ${p.category} · ${formatTry(p.price)}${p.listPrice !== p.price ? ` (liste ${formatTry(p.listPrice)})` : ""} · stok ${p.available}`)
        .join("\n");
    }
    case "get_product_details": {
      const p = result.data;
      const parts: string[] = [`**${p.name}** (${p.sku})`];
      if (p.collection) parts.push(`Koleksiyon: ${p.collection}`);
      if (p.dimensions?.width) parts.push(`Ölçüler: ${[p.dimensions.width, p.dimensions.depth, p.dimensions.height].filter(Boolean).join("×")} cm`);
      if (p.seat?.count) parts.push(`${p.seat.count} kişilik`);
      if (p.fabric?.color) parts.push(`Kumaş: ${p.fabric.type ?? ""} ${p.fabric.color}`.trim());
      if (p.frame) parts.push(`İskelet: ${p.frame}`);
      if (p.durabilityMartindale) parts.push(`Dayanıklılık: ${p.durabilityMartindale} Martindale`);
      if (p.warrantyMonths) parts.push(`Garanti: ${p.warrantyMonths} ay`);
      if (p.leadTimeDays) parts.push(`Üretim: ${p.leadTimeDays} gün`);
      parts.push(`Fiyat: ${formatTry(p.price)}${p.listPrice !== p.price ? ` (liste ${formatTry(p.listPrice)})` : ""}`);
      parts.push(`Stok: ${p.available}`);
      return parts.join("\n");
    }
    case "view_cart": {
      const r = result.data;
      if (r.count === 0) return "Sepetiniz boş.";
      const lines = r.items.map((i: any) => `• ${i.name} ×${i.quantity} = ${formatTry(i.lineTotal)}`);
      lines.push(`**Toplam: ${r.totalFormatted}**`);
      return lines.join("\n");
    }
    case "add_to_cart": {
      const r = result.data;
      return `✓ ${r.added.name} sepete eklendi (${r.added.quantity} adet, sepetteki toplam: ${r.newQuantity}).`;
    }
    case "remove_from_cart": {
      return result.data.removed ? "✓ Ürün sepetten çıkarıldı." : "Sepette o ürün yoktu.";
    }
    case "place_order": {
      const r = result.data;
      return `🎉 Sipariş oluşturuldu: **${r.orderNumber}** · Toplam: ${formatTry(r.grandTotal)}`;
    }
    case "list_my_orders": {
      const list = result.data as any[];
      if (list.length === 0) return "Henüz siparişiniz yok.";
      return list.map((o) => `• ${o.orderNumber} — ${o.status} (${o.stage}) · ${formatTry(o.total)}`).join("\n");
    }
    case "get_order_status": {
      const o = result.data;
      const parts = [`**${o.orderNumber}** — ${o.status} · ${o.stage}`];
      if (o.shipment?.truckPlate) parts.push(`TIR: ${o.shipment.truckPlate} · Şoför: ${o.shipment.driverName}`);
      if (o.shipment?.etaAt) parts.push(`Tahmini varış: ${new Date(o.shipment.etaAt).toLocaleString("tr-TR")}`);
      if (o.shipment?.deliveredAt) parts.push(`Teslim edildi: ${new Date(o.shipment.deliveredAt).toLocaleString("tr-TR")}`);
      return parts.join("\n");
    }
    default:
      return `${name} tamamlandı.`;
  }
}

function formatTry(n: string | number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(Number(n));
}
