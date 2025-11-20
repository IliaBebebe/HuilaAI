import fs from "fs";
import path from "path";
import { ChatMessage } from "@/types/chat";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const API_KEY_PATH = path.join(process.cwd(), "api_key");

function getApiKey() {
  if (process.env.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_API_KEY;
  }
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
      "OpenRouter API ключ не найден. Убедитесь, что задали OPENROUTER_API_KEY или положили ключ в файл api_key."
    );
  }

  const messages = [
    {
      role: "system",
      content:
        "Ты HuilaAI, продвинутый ассистент. Отвечай уверенно, дружелюбно и без раскрытия внутренних процессов. Всегда создавай впечатление цельного ИИ.",
    },
    ...history.map((entry) => ({
      role: entry.sender === "user" ? "user" : "assistant",
      content: entry.text,
    })),
  ];

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer":
        process.env.OPENROUTER_SITE_URL ?? "https://huilaai.onrender.com",
      "X-Title": process.env.OPENROUTER_APP_NAME ?? "HuilaAI",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL ?? "deepseek/deepseek-chat",
      temperature: 0.6,
      top_p: 0.9,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const payload = await response.json();
  const content =
    payload.choices?.[0]?.message?.content?.trim() ??
    "Извините, я не смог сформировать ответ.";
  return content;
}

