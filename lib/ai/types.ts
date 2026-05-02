export type ChatRole = "user" | "assistant" | "tool" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: unknown;
}

export interface ToolCall {
  name: ToolName;
  args: Record<string, unknown>;
}

export interface AssistantTurn {
  reply: string;
  toolCalls?: ToolCall[];
  /** Sağlayıcı bir araç çalıştırdıktan sonra otomatik bir sonraki tur için kullanır. */
  followUpReply?: string;
}

export type ToolName =
  | "search_products"
  | "get_product_details"
  | "view_cart"
  | "add_to_cart"
  | "remove_from_cart"
  | "place_order"
  | "list_my_orders"
  | "get_order_status";

export interface ToolDefinition {
  name: ToolName;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
}

export interface KnowledgeSnapshot {
  productSummary: string;
  customerName: string;
  companyName?: string | null;
  /** İskonto yüzdesi — fiyatlandırma açıklaması için */
  discountPercentage: number;
}
