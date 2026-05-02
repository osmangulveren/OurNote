import type { AssistantProvider, ProviderRequest } from "../provider";
import type { AssistantTurn } from "../types";

/**
 * Google Gemini provider — STUB.
 *
 * Gemini 1.5 Flash için ücretsiz tier mevcuttur (15 req/dk).
 * Aktive etmek için:
 *   1. https://aistudio.google.com/apikey adresinden anahtar alın
 *   2. .env'e: GEMINI_API_KEY=...
 *   3. `npm i @google/generative-ai`
 *   4. Aşağıdaki TODO bloğunu doldurun (modelin function calling formatına
 *      tools'u dönüştürün, yanıttan toolCalls'ı çıkartın).
 *
 * Şimdilik sağlayıcı seçildiğinde RuleBased'e fallback yapılır.
 */
export class GeminiProvider implements AssistantProvider {
  readonly id = "gemini" as const;

  async ask(_req: ProviderRequest): Promise<AssistantTurn> {
    // TODO: gerçek Gemini çağrısı
    // import { GoogleGenerativeAI } from "@google/generative-ai";
    // const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    // ...
    return {
      reply: "[GeminiProvider stub] Gerçek Gemini istemcisi henüz bağlı değil. Şimdilik kural-tabanlı asistan kullanılıyor.",
    };
  }
}
