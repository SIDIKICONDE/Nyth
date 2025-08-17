export type ToolType = "function";

export interface ChatCompletionFunction {
  name: string;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface ChatCompletionTool {
  type: ToolType;
  function: ChatCompletionFunction;
}

export type ChatCompletionToolChoiceOption =
  | "auto"
  | "none"
  | { type: ToolType; function: { name: string } };

export interface ChatOptions {
  prompt: string;
  history: { role: "user" | "assistant"; content: string }[];
  tools?: ChatCompletionTool[];
  tool_choice?: ChatCompletionToolChoiceOption;
}

export interface ChatCompletionToolCall {
  id?: string;
  type: ToolType;
  function: { name: string; arguments: string };
}

export interface ChatResponse {
  content: string | null;
  tool_calls?: ChatCompletionToolCall[];
}

export interface AIProvider {
  chat(options: ChatOptions): Promise<ChatResponse>;
}
