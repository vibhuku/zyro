
import { GoogleGenAI, Chat } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export function createChatSession(): Chat {
  const model = 'gemini-2.5-flash';
  return ai.chats.create({
    model,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
}
