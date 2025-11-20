import fs from "fs";
import path from "path";
import { ChatMessage } from "@/types/chat";

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/v1/chat/completions";
const API_KEY_PATH = path.join(process.cwd(), "api_key");

function getApiKey() {
  if (process.env.DEEPSEEK_API_KEY) {
    return process.env.DEEPSEEK_API_KEY;
  }

  try {
    const key = fs.readFileSync(API_KEY_PATH, "utf-8");
    return key.trim();
  } catch {
    return "";
  }
}

export async function askDeepseek(history: ChatMessage[]) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      "Deepseek API ключ не найден. Убедитесь, что файл api_key существует или задайте переменную окружения."
    );
  }

  const messages = [
    {
      role: "system",
      content:
        "Ты дружелюбный ИИ ассистент HuilaAI. Отвечай уверенно, по делу, с теплотой. Если пользователь просит человеческий ответ, следуй инструкциям администратора.",
    },
    ...history.map((entry) => ({
      role: entry.sender === "user" ? "user" : "assistant",
      content: entry.text,
    })),
  ];

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.6,
      top_p: 0.9,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Deepseek API error: ${error}`);
  }

  const payload = await response.json();
  const content =
    payload.choices?.[0]?.message?.content?.trim() ??
    "Извините, я не смог сформировать ответ.";
  return content;
}

