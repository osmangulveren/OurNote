import type { AssistantProvider, ProviderRequest } from "../provider";
import type { AssistantTurn } from "../types";

/**
 * Anthropic Claude provider — STUB.
 *
 * Önerilen model: `claude-haiku-4-5-20251001` (en uygun maliyet) veya
 * `claude-sonnet-4-6` (daha kaliteli yanıtlar).
 * Aktive etmek için:
 *   1. .env'e: ANTHROPIC_API_KEY=...
 *   2. `npm i @anthropic-ai/sdk`
 *   3. Aşağıdaki TODO bloğunu doldurun (TOOL_DEFS'i Anthropic
 *      `tools` formatına dönüştürün, response içindeki `tool_use`
 *      bloklarını AssistantTurn.toolCalls'a çevirin).
 *   4. Prompt caching açın (system prompt + KB için cache_control).
 */
export class ClaudeProvider implements AssistantProvider {
  readonly id = "claude" as const;

  async ask(_req: ProviderRequest): Promise<AssistantTurn> {
    // TODO: gerçek Anthropic çağrısı
    // import Anthropic from "@anthropic-ai/sdk";
    // const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    // const res = await client.messages.create({
    //   model: "claude-haiku-4-5-20251001",
    //   max_tokens: 1024,
    //   system: [{ type: "text", text: req.systemPrompt, cache_control: { type: "ephemeral" } }],
    //   messages: req.messages.map(...),
    //   tools: convertTools(req.tools),
    // });
    // ...
    return {
      reply: "[ClaudeProvider stub] Gerçek Anthropic istemcisi henüz bağlı değil. Şimdilik kural-tabanlı asistan kullanılıyor.",
    };
  }
}
