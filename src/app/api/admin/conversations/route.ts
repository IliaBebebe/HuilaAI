import { NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/auth";
import { listConversations } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Нет доступа" }, { status: 401 });
    }

    const conversations = await listConversations();
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Admin conversations error", error);
    return NextResponse.json(
      { error: "Не удалось получить чаты" },
      { status: 500 }
    );
  }
}

