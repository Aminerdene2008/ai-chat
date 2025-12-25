import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const groq = new Groq({ apiKey: GROQ_API_KEY });

export const GET = async (req: NextRequest, { params }: { params: Promise<{ characterId: string }> }) => {
  const { characterId } = await params;

  const chats = await prisma.message.findMany({
    where: {
      characterId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json(chats);
};

export const POST = async (req: NextRequest, { params }: { params: Promise<{ characterId: string }> }) => {
  const { characterId } = await params;
  const { content }: Prisma.MessageCreateInput = await req.json();

  const character = await prisma.character.findUnique({ where: { id: characterId } });

  if (!character) {
    return NextResponse.json({ message: "Character not found!" }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: {
      characterId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Build chat history for Groq
  const chatHistory: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    {
      role: "system",
      content: character.basePrompt,
    },
    {
      role: "assistant",
      content: character.greetingText,
    },
  ];

  // Add previous messages to history
  messages.forEach((message) => {
    chatHistory.push({
      role: message.role === "model" ? "assistant" : (message.role as "user"),
      content: message.content,
    });
  });

  // Add the new user message
  chatHistory.push({
    role: "user",
    content,
  });

  try {
    // Call Groq API
    const chatResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Fast and powerful free model
      messages: chatHistory,
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse = chatResponse.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    // Save user message
    await prisma.message.create({
      data: {
        character: {
          connect: {
            id: characterId,
          },
        },
        content,
        role: "user",
      },
    });

    // Save AI response
    await prisma.message.create({
      data: {
        character: {
          connect: {
            id: characterId,
          },
        },
        content: aiResponse,
        role: "model",
      },
    });

    return NextResponse.json({ message: aiResponse });
  } catch (error: any) {
    console.error("Groq API error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate response" }, { status: 500 });
  }
};