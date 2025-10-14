import { os } from "@orpc/server";
import { z } from "zod";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import { promises as fs } from "fs";
import { generateObject } from "ai";
import { OpenAICompatibleChatLanguageModel } from "@ai-sdk/openai-compatible";
const storage = createStorage({
  driver: fsDriver({ base: "./.storage" }),
});
const SEED_FILE_PATH = "./data/prompts.json";
const USER_FILE_KEY = "prompts.json";
const PromptSchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string(),
  prompt: z.string(),
  color: z.string(),
  recentlyUsedAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

type Prompt = z.infer<typeof PromptSchema>;

if (!process.env.OPENAI_BASE_URL) {
  throw new Error("OPENAI_BASE_URL is not set");
}
if (!process.env.OPENAI_DEFAULT_MODEL) {
  throw new Error("OPENAI_DEFAULT_MODEL is not set");
}

const DEFAULT_MODEL = process.env.OPENAI_DEFAULT_MODEL;

const model = new OpenAICompatibleChatLanguageModel(DEFAULT_MODEL, {
  provider: "openai-compatible",
  url: ({ path }) => {
    const url = new URL(`${process.env.OPENAI_BASE_URL}${path}`);
    return url.toString();
  },
  headers: () => ({
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  }),
  supportsStructuredOutputs: true,
});

const COLORS = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
];
function getRandomColor(): string {
  const randomIndex = Math.floor(Math.random() * COLORS.length);
  return COLORS[randomIndex];
}
async function ensureUserStorage(): Promise<void> {
  try {
    const userPrompts = await storage.getItem<Prompt[]>(USER_FILE_KEY);

    if (!userPrompts) {
      try {
        const seedData = await fs.readFile(SEED_FILE_PATH, "utf-8");
        const parsedSeedData = JSON.parse(seedData) as Prompt[];
        await fs.mkdir("./.storage", { recursive: true });
        await storage.setItem(USER_FILE_KEY, parsedSeedData);
        console.log("Seeded user prompts from data file");
      } catch (seedError) {
        console.warn(
          "Could not seed from data file, creating empty prompts:",
          seedError
        );
        await storage.setItem(USER_FILE_KEY, []);
      }
    }
  } catch (error) {
    console.error("Error ensuring user storage:", error);
  }
}
const loadPrompts = os.handler(async () => {
  try {
    await ensureUserStorage();
    const data = await storage.getItem<Prompt[]>(USER_FILE_KEY);
    return data || [];
  } catch (error) {
    console.error("Failed to load prompts:", error);
    return [];
  }
});
const savePrompts = os
  .input(z.array(PromptSchema))
  .handler(async ({ input }) => {
    try {
      await ensureUserStorage();
      await storage.setItem(USER_FILE_KEY, input);
      return { success: true };
    } catch (error) {
      console.error("Failed to save prompts:", error);
      throw new Error("Failed to save prompts");
    }
  });
const addPrompt = os.input(PromptSchema).handler(async ({ input }) => {
  try {
    await ensureUserStorage();
    const prompts = (await storage.getItem<Prompt[]>(USER_FILE_KEY)) || [];
    if (prompts.some((p) => p.id === input.id)) {
      throw new Error("Prompt with this ID already exists");
    }

    const now = new Date().toISOString();
    const promptWithTimestamps = {
      ...input,
      updatedAt: now,
      recentlyUsedAt: now,
    };

    prompts.push(promptWithTimestamps);
    await storage.setItem(USER_FILE_KEY, prompts);
    return { success: true, prompt: promptWithTimestamps };
  } catch (error) {
    console.error("Failed to add prompt:", error);
    throw new Error("Failed to add prompt");
  }
});
const updatePrompt = os.input(PromptSchema).handler(async ({ input }) => {
  try {
    await ensureUserStorage();
    const prompts = (await storage.getItem<Prompt[]>(USER_FILE_KEY)) || [];
    const index = prompts.findIndex((p) => p.id === input.id);

    if (index === -1) {
      throw new Error("Prompt not found");
    }

    const updatedPrompt = {
      ...input,
      updatedAt: new Date().toISOString(),
      recentlyUsedAt: prompts[index].recentlyUsedAt || new Date().toISOString(),
    };

    prompts[index] = updatedPrompt;
    await storage.setItem(USER_FILE_KEY, prompts);
    return { success: true, prompt: updatedPrompt };
  } catch (error) {
    console.error("Failed to update prompt:", error);
    throw new Error("Failed to update prompt");
  }
});
const deletePrompt = os
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    try {
      await ensureUserStorage();
      const prompts = (await storage.getItem<Prompt[]>(USER_FILE_KEY)) || [];
      const filteredPrompts = prompts.filter((p) => p.id !== input.id);

      if (filteredPrompts.length === prompts.length) {
        throw new Error("Prompt not found");
      }

      await storage.setItem(USER_FILE_KEY, filteredPrompts);
      return { success: true };
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      throw new Error("Failed to delete prompt");
    }
  });
const markPromptAsUsed = os
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    try {
      await ensureUserStorage();
      const prompts = (await storage.getItem<Prompt[]>(USER_FILE_KEY)) || [];
      const index = prompts.findIndex((p) => p.id === input.id);

      if (index === -1) {
        throw new Error("Prompt not found");
      }

      prompts[index] = {
        ...prompts[index],
        recentlyUsedAt: new Date().toISOString(),
      };

      await storage.setItem(USER_FILE_KEY, prompts);
      return { success: true };
    } catch (error) {
      console.error("Failed to mark prompt as used:", error);
      throw new Error("Failed to mark prompt as used");
    }
  });
const generateIconAndTitle = os
  .input(
    z.object({
      title: z.string().optional(),
      prompt: z.string(),
    })
  )
  .handler(async ({ input }) => {
    try {
      const systemPrompt = `Based on the prompt content and title if included, suggest:
1. A single Lucide icon name (from https://lucide.dev/icons/) that best represents the prompt's purpose
3. A short, descriptive title (2-4 words) if no title is provided

Popular Lucide icons: Mail, MessageSquare, FileText, Edit, Sparkles, Zap, Brain, Lightbulb, Target, Wand2, PenTool, BookOpen, Users, Settings, Heart, Star, Briefcase, Calendar, Clock, Home, Search, Filter, Tag, Flag, Award, Shield, Key, Lock, Eye, Image, Video, Music, Phone, Globe, Map, Car, Plane, Coffee, Gift, ShoppingCart, CreditCard, Wallet, Calculator, Camera, Mic, Speaker, Headphones, Gamepad2, Tv, Monitor, Smartphone, Laptop, Tablet, Printer, Database, Server, Cloud, Wifi, Bluetooth, Battery, Power, Plug, Cpu, HardDrive, MemoryStick, MousePointer, Keyboard, Mouse

Examples:
- For email writing: icon: "Mail", title: "Email Writer"
- For creative writing: icon: "PenTool", title: "Creative Writer"
- For organizing: icon: "FolderOpen", title: "Task Organizer"`;

      const userPrompt = `Title: ${
        input.title || "(please generate a short title)"
      }
Prompt: ${input.prompt}`;

      const result = await generateObject({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        schema: z.object({
          icon: z
            .string()
            .describe(
              "A Lucide icon name that represents the prompt's purpose"
            ),
          title: z
            .string()
            .optional()
            .describe(
              "A short, descriptive title (2-4 words) for the prompt - only generate if no title was provided in the input"
            ),
        }),
      });

      const suggestion = await result.object;

      console.log("Generated icon & title:", suggestion);

      const color = getRandomColor();
      return {
        icon: suggestion.icon || "Sparkles",
        color: `bg-gradient-to-br from-${color}-500 to-${color}-600`,
        ...(suggestion.title && !input.title && { title: suggestion.title }),
      };
    } catch (error) {
      console.error("Failed to generate icon and color:", error);
      return {
        icon: "Sparkles",
        color: "bg-gradient-to-br from-blue-500 to-blue-600",
      };
    }
  });

export const router = {
  loadPrompts,
  savePrompts,
  addPrompt,
  updatePrompt,
  deletePrompt,
  markPromptAsUsed,
  generateIconAndTitle,
};
