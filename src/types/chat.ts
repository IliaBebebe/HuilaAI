export type Sender = "user" | "ai" | "admin";

export interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  createdAt: string;
  via?: "ai" | "manual";
  pending?: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  createdAt: string;
  manualMode: boolean;
  waitingForManual: boolean;
  messages: ChatMessage[];
}

