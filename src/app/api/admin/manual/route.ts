import { NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/auth";
import { setManualMode } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const { password, conversationId, enabled } = await request.json();
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
    }

    if (!conversationId || typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "Неверные параметры" },
        { status: 400 }
      );
    }

    const conversation = await setManualMode(conversationId, enabled);
    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("Manual toggle error", error);
    return NextResponse.json(
      { error: "Не удалось изменить режим" },
      { status: 500 }
    );
  }
}

