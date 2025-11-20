import { NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/auth";
import { appendMessage, markWaiting } from "@/lib/storage";
import { ChatMessage } from "@/types/chat";

export async function POST(request: Request) {
  try {
    const { password, conversationId, text } = await request.json();
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
    }

    if (!conversationId || !text) {
      return NextResponse.json(
        { error: "Неверные параметры" },
        { status: 400 }
      );
    }

    const adminMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "admin",
      text: text.slice(0, 2000),
      createdAt: new Date().toISOString(),
      via: "manual",
    };
    const conversation = await appendMessage(conversationId, adminMessage);
    await markWaiting(conversationId, false);

    return NextResponse.json({ conversation, reply: adminMessage });
  } catch (error) {
    console.error("Manual reply error", error);
    return NextResponse.json(
      { error: "Не удалось отправить ручной ответ" },
      { status: 500 }
    );
  }
}

