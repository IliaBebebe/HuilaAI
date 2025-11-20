import { NextResponse } from "next/server";
import {
  appendMessage,
  getConversation,
  markWaiting,
} from "@/lib/storage";
import { askDeepseek } from "@/lib/deepseek";
import { ChatMessage } from "@/types/chat";

export async function POST(request: Request) {
  try {
    const { conversationId, message } = await request.json();
    if (!conversationId || !message) {
      return NextResponse.json(
        { error: "Не хватает данных запроса." },
        { status: 400 }
      );
    }

    const conversation = await getConversation(conversationId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Диалог не существует." },
        { status: 404 }
      );
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: message.slice(0, 2000),
      createdAt: new Date().toISOString(),
      via: "ai",
    };

    await appendMessage(conversationId, userMessage);

    if (conversation.manualMode) {
      await markWaiting(conversationId, true);
      return NextResponse.json({ status: "pending_manual" });
    }

    const history = [...conversation.messages, userMessage].slice(-12);
    const aiReply = await askDeepseek(history);
    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "ai",
      text: aiReply,
      createdAt: new Date().toISOString(),
      via: "ai",
    };
    await appendMessage(conversationId, aiMessage);
    return NextResponse.json({ status: "ok", reply: aiMessage });
  } catch (error) {
    console.error("Chat error", error);
    return NextResponse.json(
      { error: "Не удалось получить ответ от ИИ." },
      { status: 500 }
    );
  }
}

