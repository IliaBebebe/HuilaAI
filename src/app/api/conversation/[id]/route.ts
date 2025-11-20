import { NextResponse } from "next/server";
import { getConversation } from "@/lib/storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const conversation = await getConversation(id);
    if (!conversation) {
      return NextResponse.json({ error: "Чат не найден" }, { status: 404 });
    }
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Conversation fetch error", error);
    return NextResponse.json(
      { error: "Не удалось загрузить чат" },
      { status: 500 }
    );
  }
}

