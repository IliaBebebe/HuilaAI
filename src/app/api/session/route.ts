import { NextResponse } from "next/server";
import { createConversation } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Введите имя, чтобы начать." },
        { status: 400 }
      );
    }

    const safeName = name.trim().slice(0, 32);
    if (!safeName) {
      return NextResponse.json(
        { error: "Имя не может быть пустым." },
        { status: 400 }
      );
    }

    const conversation = await createConversation(safeName);
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Session create error", error);
    return NextResponse.json(
      { error: "Не удалось создать сессию." },
      { status: 500 }
    );
  }
}

