import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ChatMessage, Conversation } from "@/types/chat";

type ConversationWithMessages = Prisma.ConversationGetPayload<{
  include: { messages: true };
}>;

function serializeConversation(
  conversation: ConversationWithMessages
): Conversation {
  if (!conversation) {
    throw new Error("Conversation is missing");
  }
  return {
    id: conversation.id,
    name: conversation.name,
    createdAt: conversation.createdAt.toISOString(),
    manualMode: conversation.manualMode,
    waitingForManual: conversation.waitingForManual,
    messages: conversation.messages.map((message) => ({
      id: message.id,
      sender: message.sender as ChatMessage["sender"],
      text: message.text,
      createdAt: message.createdAt.toISOString(),
      via: message.via as ChatMessage["via"],
    })),
  };
}

async function ensureConversation(id: string) {
  const conversation = await getConversation(id);
  if (!conversation) {
    throw new Error("Conversation not found");
  }
  return conversation;
}

export async function getConversation(id: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
  return conversation ? serializeConversation(conversation) : null;
}

export async function createConversation(name: string) {
  const conversation = await prisma.conversation.create({
    data: {
      name,
    },
    include: {
      messages: true,
    },
  });
  return serializeConversation(conversation);
}

export async function appendMessage(
  conversationId: string,
  message: ChatMessage
) {
  await prisma.message.create({
    data: {
      id: message.id,
      conversationId,
      sender: message.sender,
      text: message.text,
      via: message.via,
      createdAt: new Date(message.createdAt),
    },
  });
  return ensureConversation(conversationId);
}

export async function listConversations() {
  const conversations = await prisma.conversation.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
  return conversations.map(serializeConversation);
}

export async function setManualMode(conversationId: string, enabled: boolean) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      manualMode: enabled,
      ...(enabled ? {} : { waitingForManual: false }),
    },
  });
  return ensureConversation(conversationId);
}

export async function markWaiting(
  conversationId: string,
  waiting: boolean
) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      waitingForManual: waiting,
    },
  });
  return ensureConversation(conversationId);
}

