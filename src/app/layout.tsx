import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HuilaAI — свободный ИИ-агрегатор",
  description:
    "HuilaAI — личный экспериментальный агрегатор нейросетей. Современный чат клиент, ручные ответы, админ панель.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} bg-night text-white`}>
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  );
}

