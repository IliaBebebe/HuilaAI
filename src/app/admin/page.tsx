"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import type { Conversation } from "@/types/chat";

const authFetcher = async ([url, password]: [string, string]) => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    throw new Error("Неверный пароль");
  }
  return res.json();
};

export default function AdminPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [manualResponse, setManualResponse] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, mutate, isLoading } = useSWR<{ conversations: Conversation[] }>(
    secret ? ["/api/admin/conversations", secret] : null,
    authFetcher,
    {
      refreshInterval: secret ? 4000 : 0,
      shouldRetryOnError: false,
    }
  );

  const conversations = useMemo(
    () => data?.conversations ?? [],
    [data?.conversations]
  );
  const selectedConversation = useMemo(() => {
    return conversations.find((item) => item.id === selectedChat);
  }, [conversations, selectedChat]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch("/api/admin/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Ошибка входа");
      }
      setSecret(passwordInput);
      setPasswordInput("");
      setError(null);
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
      setSecret(null);
    }
  };

  const toggleManual = async () => {
    if (!secret || !selectedConversation) return;
    await fetch("/api/admin/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: secret,
        conversationId: selectedConversation.id,
        enabled: !selectedConversation.manualMode,
      }),
    });
    await mutate();
  };

  const sendManualResponse = async () => {
    if (!secret || !selectedConversation || !manualResponse.trim()) return;
    await fetch("/api/admin/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        password: secret,
        conversationId: selectedConversation.id,
        text: manualResponse.trim(),
      }),
    });
    setManualResponse("");
    await mutate();
  };

  if (!secret) {
    return (
      <div className="min-h-screen bg-night flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="glass-panel max-w-md w-full p-10 space-y-6"
        >
          <p className="text-sm uppercase tracking-[0.4em] text-accentMuted text-center">
            Админ вход
          </p>
          <h1 className="text-3xl font-semibold text-center">HuilaAI</h1>
          <input
            type="password"
            autoFocus
            value={passwordInput}
            onChange={(event) => setPasswordInput(event.target.value)}
            placeholder="Пароль"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          {error && (
            <p className="text-center text-red-400 text-sm bg-red-400/10 rounded-xl py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full bg-accent hover:bg-accentMuted text-white py-3 rounded-2xl transition"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night p-6 md:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-accentMuted">
            Панель
          </p>
          <h1 className="text-3xl font-semibold">HuilaAI Admin</h1>
        </div>
        <button
          onClick={() => {
            setSecret(null);
            setSelectedChat(null);
          }}
          className="text-sm text-gray-400 hover:text-white"
        >
          Выйти
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <div className="glass-panel p-4 overflow-y-auto h-[75vh] space-y-3">
          {isLoading && <p className="text-sm text-gray-400">Загрузка...</p>}
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedChat(conversation.id)}
              className={`w-full text-left px-4 py-3 rounded-2xl border transition ${
                conversation.id === selectedChat
                  ? "border-accent bg-accent/10"
                  : "border-transparent bg-white/5"
              }`}
            >
              <p className="font-semibold">{conversation.name}</p>
              <p className="text-xs text-gray-400">
                {new Date(conversation.createdAt).toLocaleString("ru-RU")}
              </p>
              <p className="text-xs mt-1 text-gray-500">
                Сообщений: {conversation.messages.length}
              </p>
            </button>
          ))}
        </div>

        <div className="glass-panel p-6 flex flex-col h-[75vh]">
          {selectedConversation ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-400 uppercase tracking-[0.4em]">
                    Пользователь
                  </p>
                  <h2 className="text-2xl font-semibold">
                    {selectedConversation.name}
                  </h2>
                </div>
                <button
                  onClick={toggleManual}
                  className={`px-4 py-2 rounded-2xl text-sm font-medium ${
                    selectedConversation.manualMode
                      ? "bg-warning/30 text-warning"
                      : "bg-accent/30 text-accent"
                  }`}
                >
                  {selectedConversation.manualMode
                    ? "Выкл. ручной режим"
                    : "Вкл. ручной режим"}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                <AnimatePresence initial={false}>
                  {selectedConversation.messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`p-4 rounded-2xl border ${
                        message.sender === "user"
                          ? "border-white/10 bg-white/5"
                          : message.sender === "admin"
                          ? "border-warning/40 bg-warning/10"
                          : "border-accent/40 bg-accent/5"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.4em] text-gray-400 mb-2">
                        {message.sender}
                      </p>
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      <p className="text-xs text-gray-500 mt-3">
                        {new Date(message.createdAt).toLocaleTimeString(
                          "ru-RU"
                        )}
                      </p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="border-t border-white/5 mt-4 pt-4">
                <textarea
                  value={manualResponse}
                  onChange={(event) => setManualResponse(event.target.value)}
                  placeholder="Напишите ответ, который увидит пользователь..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <div className="flex justify-end mt-3 gap-3">
                  <button
                    onClick={() => setManualResponse("")}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Очистить
                  </button>
                  <button
                    onClick={sendManualResponse}
                    disabled={!manualResponse.trim()}
                    className="bg-accent hover:bg-accentMuted disabled:opacity-50 text-white px-5 py-2 rounded-xl transition"
                  >
                    Отправить вручную
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Выберите чат слева
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

