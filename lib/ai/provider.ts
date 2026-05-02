import type { AssistantTurn, ChatMessage, KnowledgeSnapshot, ToolDefinition } from "./types";

export interface ProviderRequest {
  systemPrompt: string;
  messages: ChatMessage[];
  tools: ToolDefinition[];
  knowledge: KnowledgeSnapshot;
}

/**
 * Tüm AI sağlayıcıları bu arayüzü uygular.
 *
 * Sağlayıcı, hem doğal dil cevabı (`reply`) hem de çağrılması istenen
 * araçları (`toolCalls`) döndürebilir. Orchestrator, dönen toolCalls'ı
 * çalıştırıp sonuçları geri yollayarak kapanış cevabını alır.
 */
export interface AssistantProvider {
  readonly id: "rule-based" | "gemini" | "claude";
  ask(req: ProviderRequest): Promise<AssistantTurn>;
}
