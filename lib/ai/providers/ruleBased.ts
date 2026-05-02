import type { AssistantProvider, ProviderRequest } from "../provider";
import type { AssistantTurn, ToolCall } from "../types";

/**
 * API key olmadan çalışan, deterministik kural-tabanlı sağlayıcı.
 *
 * Yetenekleri sınırlıdır ama demo'nun ilk 5 dakikasında gösterilebilir
 * sonuç verir. Anahtar geldiğinde ClaudeProvider veya GeminiProvider'a
 * geçilir; kullanıcı tarafında değişiklik olmaz.
 */
export class RuleBasedProvider implements AssistantProvider {
  readonly id = "rule-based" as const;

  async ask(req: ProviderRequest): Promise<AssistantTurn> {
    const last = req.messages[req.messages.length - 1];
    if (!last || last.role !== "user") {
      return { reply: "Yardımcı olabilmem için bir soru yazın." };
    }
    const text = last.content.toLowerCase().trim();
    const original = last.content.trim();

    // Sepete ekle — esnek: "sepete ekle SKU qty", "SKU ekle", "sepetime SKU ekle", vb.
    const skuPattern = /\b([a-z]{3,}-[a-z0-9-]{2,})\b/i;
    if (/(ekle|sepete|sepetime|sepetimde)/i.test(text) && skuPattern.test(original)) {
      const skuMatch = original.match(skuPattern);
      const qtyMatch = text.match(/\b(\d{1,3})\b/);
      if (skuMatch) {
        return {
          reply: "Sepetinize ekliyorum…",
          toolCalls: [{
            name: "add_to_cart",
            args: { productId: skuMatch[1].toUpperCase(), quantity: Number(qtyMatch?.[1] ?? 1) },
          }],
        };
      }
    }

    // Sepet görüntüle (SKU yoksa)
    if (/(sepet|cart)/i.test(text) && !skuPattern.test(original)) {
      return { reply: "Sepetinize bakıyorum…", toolCalls: [{ name: "view_cart", args: {} }] };
    }

    // Sipariş listesi
    if (/(siparişlerim|sipariş listesi|orderlarım|orders\b)/i.test(text)) {
      return { reply: "Siparişlerinizi getiriyorum…", toolCalls: [{ name: "list_my_orders", args: {} }] };
    }

    // Sipariş durumu — ORD-…
    const orderMatch = text.match(/ord[-_]?\d{8}[-_]?\d+/i);
    if (orderMatch) {
      return {
        reply: `${orderMatch[0]} siparişinin durumuna bakıyorum…`,
        toolCalls: [{ name: "get_order_status", args: { orderNumber: orderMatch[0].toUpperCase() } }],
      };
    }

    // Sipariş ver / onayla
    if (/(sipariş(i)? (ver|onayla|geç)|place order|onaylıyorum)/i.test(text)) {
      return {
        reply: "Sepetinizdeki ürünlerle siparişi oluşturuyorum…",
        toolCalls: [{ name: "place_order", args: {} }],
      };
    }

    // Kategori veya kelime arama
    const categoryMatch = text.match(/(şömine|somine|kanepe|koltuk|set)/i);
    if (categoryMatch || /(ara|bul|öner|göster|recommend|search)/i.test(text)) {
      const query = categoryMatch?.[0] ?? text.replace(/(ara|bul|öner|göster|recommend|search)/gi, "").trim();
      return {
        reply: `"${query || "katalog"}" ile arıyorum…`,
        toolCalls: [{ name: "search_products", args: { query } }],
      };
    }

    // Ürün adı veya SKU sorulmuşsa detay
    const skuMatch = text.match(/[A-Z]{3,}-?[A-Z0-9-]{2,}/i);
    if (skuMatch) {
      return {
        reply: `${skuMatch[0]} ürününün detayını getiriyorum…`,
        toolCalls: [{ name: "get_product_details", args: { productId: skuMatch[0].toUpperCase() } }],
      };
    }

    // Fallback — yardım menüsü
    return {
      reply:
        `Merhaba ${req.knowledge.customerName}! Şunları yapabilirim:\n` +
        `• "kanepe öner" / "şömine göster" — kategoriden ürün listele\n` +
        `• "TUFTED-ROYALE-3 detayı" — bir ürünün özelliklerini ver\n` +
        `• "sepetimi göster" — sepet içeriği\n` +
        `• "sepete ekle BOUCLE-NORMAL-3 2" — ürün ekle\n` +
        `• "siparişi onayla" — sepetten sipariş oluştur\n` +
        `• "siparişlerim" / "ORD-... durumu" — sipariş takibi`,
    };
  }
}
