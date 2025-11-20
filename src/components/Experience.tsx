import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import type { ChatMessage, Conversation } from "@/types/chat";

const storageKey = "huilaai.session";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Ошибка загрузки чата");
  }
  return res.json();
};

interface SessionData {
  id: string;
  name: string;
}

function loadSession(): SessionData | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(storageKey);
  return stored ? (JSON.parse(stored) as SessionData) : null;
}

function persistSession(session: SessionData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(session));
}

export default function Experience() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [pendingName, setPendingName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "typing" | "manual">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  const { data, mutate } = useSWR<{ conversation: Conversation }>(
    session ? `/api/conversation/${session.id}` : null,
    fetcher,
    {
      refreshInterval: session ? 4000 : 0,
      shouldRetryOnError: false,
    }
  );

  const messages = data?.conversation.messages ?? [];
  const manualMode = data?.conversation.manualMode ?? false;
  const waitingManual = data?.conversation.waitingForManual ?? false;

  useEffect(() => {
    if (!session && data?.conversation) {
      setSession({ id: data.conversation.id, name: data.conversation.name });
    }
  }, [data, session]);

  useEffect(() => {
    if (waitingManual && status !== "manual") {
      setStatus("manual");
    }
    if (!waitingManual && status === "manual") {
      setStatus("idle");
    }
  }, [waitingManual, status]);

  const handleGateSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const safeName = pendingName.trim();
      if (!safeName) {
        setError("Введите имя, чтобы начать.");
        return;
      }
      try {
        setError(null);
        const response = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: safeName }),
        });
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error ?? "Не удалось создать чат");
        }
        const payload = await response.json();
        persistSession(payload.conversation);
        setSession(payload.conversation);
        setPendingName("");
        mutate();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ошибка создания чата");
      }
    },
    [pendingName, mutate]
  );

  const sendPrompt = useCallback(async () => {
    if (!prompt.trim() || !session) return;
    try {
      setIsSending(true);
      setStatus(manualMode ? "manual" : "typing");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: session.id,
          message: prompt.trim(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Не удалось отправить сообщение");
      }

      const payload = await response.json();
      if (payload.status === "ok") {
        await mutate();
        setStatus("idle");
      } else {
        setStatus("manual");
      }
      setPrompt("");
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
      setStatus("idle");
    } finally {
      setIsSending(false);
    }
  }, [prompt, session, mutate, manualMode]);

  const showGate = !session;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <GradientBackdrop />
      <main className="relative z-10 flex flex-col items-center px-4 py-10 md:py-16">
        <header className="w-full max-w-5xl mb-10 flex flex-col gap-4 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-accentMuted">
            Личный эксперимент
          </p>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">
            HuilaAI
          </h1>
          <p className="text-base md:text-lg text-gray-300 leading-relaxed">
            Свободный агрегатор нейросетей без рекламы и регистрации. Просто
            назовите себя и начните диалог с ИИ — в любой момент админ может
            незаметно перехватить общение в ручном режиме.
          </p>
        </header>

        <section className="w-full max-w-5xl">
          <div className="glass-panel relative">
            {showGate ? (
              <NameGate
                pendingName={pendingName}
                onNameChange={setPendingName}
                onSubmit={handleGateSubmit}
                error={error}
              />
            ) : (
              <ChatSurface
                messages={messages}
                prompt={prompt}
                setPrompt={setPrompt}
                sendPrompt={sendPrompt}
                isSending={isSending}
                status={status}
                name={session?.name ?? ""}
                waitingManual={waitingManual}
                manualMode={manualMode}
                error={error}
                clearError={() => setError(null)}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

const GradientBackdrop = () => (
  <div className="absolute inset-0 bg-gradient-to-br from-night via-graphite to-night">
    <div className="absolute -top-32 right-0 w-[480px] h-[480px] bg-accent/30 blur-[130px]" />
    <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-success/20 blur-[160px]" />
  </div>
);

interface NameGateProps {
  pendingName: string;
  onNameChange(value: string): void;
  onSubmit(event: React.FormEvent): void;
  error: string | null;
}

const NameGate = ({
  pendingName,
  onNameChange,
  onSubmit,
  error,
}: NameGateProps) => (
  <form
    onSubmit={onSubmit}
    className="flex flex-col gap-6 p-8 md:p-12 text-left"
  >
    <div>
      <p className="text-sm uppercase tracking-[0.3em] text-accentMuted">
        Шаг 1
      </p>
      <h2 className="text-2xl md:text-3xl font-semibold mt-2">
        Как к тебе обращаться?
      </h2>
      <p className="text-gray-400 mt-2">
        Имя нужно один раз, чтобы персонализировать чат. Никаких логинов и
        паролей.
      </p>
    </div>

    <label className="flex flex-col gap-3">
      <span className="text-sm text-gray-400">Ваше имя</span>
      <input
        className="bg-night/60 border border-white/10 rounded-2xl px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all"
        value={pendingName}
        maxLength={32}
        placeholder="Например, Саша"
        onChange={(event) => onNameChange(event.target.value)}
      />
    </label>
    {error && (
      <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/40 rounded-xl px-4 py-3">
        {error}
      </p>
    )}

    <button
      type="submit"
      className="bg-accent text-white py-4 rounded-2xl text-lg font-medium shadow-glass hover:bg-accentMuted transition"
    >
      Открыть чат
    </button>
  </form>
);

interface ChatSurfaceProps {
  messages: ChatMessage[];
  prompt: string;
  setPrompt(next: string): void;
  sendPrompt(): Promise<void>;
  isSending: boolean;
  status: "idle" | "typing" | "manual";
  name: string;
  waitingManual: boolean;
  manualMode: boolean;
  error: string | null;
  clearError(): void;
}

const ChatSurface = ({
  messages,
  prompt,
  setPrompt,
  sendPrompt,
  isSending,
  status,
  name,
  waitingManual,
  manualMode,
  error,
  clearError,
}: ChatSurfaceProps) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isSending) {
      void sendPrompt();
    }
  };

  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, scrollAnchorRef]);

  return (
    <div className="flex flex-col h-[70vh] md:h-[75vh]">
      <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div>
          <p className="text-sm text-gray-400 uppercase tracking-[0.35em]">
            СЕССИЯ
          </p>
          <p className="text-xl font-semibold mt-1">{name}</p>
        </div>
        <StatusBadge manualMode={manualMode} waitingManual={waitingManual} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MessageBubble message={message} />
            </motion.div>
          ))}
        </AnimatePresence>
        {status === "typing" && (
          <TypingState label="ИИ печатает ответ..." variant="ai" />
        )}
        {(status === "manual" || waitingManual) && (
          <TypingState label="Ответ готовит человек-оператор..." variant="manual" />
        )}
        <div ref={scrollAnchorRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-white/5 px-6 py-4 flex flex-col gap-3"
      >
        {error && (
          <div className="bg-red-400/10 border border-red-400/30 text-red-200 rounded-2xl px-4 py-2 text-sm flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              type="button"
              onClick={clearError}
              className="text-red-200 hover:text-white"
            >
              ×
            </button>
          </div>
        )}
        <textarea
          className="bg-white/5 rounded-2xl px-4 py-3 min-h-[90px] resize-none focus:outline-none focus:ring-2 focus:ring-accent/60"
          placeholder="Спросите что угодно..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending || !prompt.trim()}
          className="self-end bg-accent hover:bg-accentMuted disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl transition"
        >
          {isSending ? "Отправка..." : "Отправить"}
        </button>
      </form>
    </div>
  );
};

const StatusBadge = ({
  manualMode,
  waitingManual,
}: {
  manualMode: boolean;
  waitingManual: boolean;
}) => {
  const label = waitingManual
    ? "Ручной ответ"
    : manualMode
    ? "Ручной режим"
    : "Авто режим";
  const color = waitingManual
    ? "bg-warning/20 text-warning"
    : manualMode
    ? "bg-accent/20 text-accent"
    : "bg-white/10 text-gray-300";

  return (
    <span className={`px-4 py-2 rounded-full text-sm font-medium ${color}`}>
      {label}
    </span>
  );
};

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.sender === "user";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} text-base`}
    >
      <div
        className={`rounded-2xl px-5 py-4 max-w-[85%] leading-relaxed shadow-glass ${
          isUser
            ? "bg-accent text-white rounded-br-none"
            : "bg-white/5 text-gray-100 border border-white/5 rounded-bl-none"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>
      </div>
    </div>
  );
};

const TypingState = ({
  label,
  variant,
}: {
  label: string;
  variant: "ai" | "manual";
}) => (
  <div className="flex items-center gap-3 text-sm text-gray-400">
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${
        variant === "manual" ? "bg-warning/30" : "bg-accent/30"
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
    </div>
    <p>{label}</p>
  </div>
);

