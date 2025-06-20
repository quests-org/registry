import { os } from "@orpc/server";
import { z } from "zod";
import { createStorage } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import { promises as fs } from "fs";
import { generateObject } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Initialize storage with filesystem driver for user data
const storage = createStorage({
  driver: fsDriver({ base: "./.storage" }),
});

// Paths for seed data and user storage
const SEED_FILE_PATH = "./data/prompts.json";
const USER_FILE_KEY = "prompts.json";

// Prompt schema
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

const openai = createOpenAICompatible({
  name: "openai-compatible",
  baseURL: process.env.OPENAI_BASE_URL!,
  apiKey: process.env.OPENAI_API_KEY,
});

// Available colors for prompt templates
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

// Function to select a random color
function getRandomColor(): string {
  const randomIndex = Math.floor(Math.random() * COLORS.length);
  return COLORS[randomIndex];
}

// Ensure user storage exists and seed if needed
async function ensureUserStorage(): Promise<void> {
  try {
    // Check if user file exists
    const userPrompts = await storage.getItem<Prompt[]>(USER_FILE_KEY);

    if (!userPrompts) {
      // User file doesn't exist, seed from data file
      try {
        const seedData = await fs.readFile(SEED_FILE_PATH, "utf-8");
        const parsedSeedData = JSON.parse(seedData) as Prompt[];

        // Create .storage directory if it doesn't exist
        await fs.mkdir("./.storage", { recursive: true });

        // Save seed data to user storage
        await storage.setItem(USER_FILE_KEY, parsedSeedData);
        console.log("Seeded user prompts from data file");
      } catch (seedError) {
        console.warn(
          "Could not seed from data file, creating empty prompts:",
          seedError
        );
        // If seed file doesn't exist, create empty array
        await storage.setItem(USER_FILE_KEY, []);
      }
    }
  } catch (error) {
    console.error("Error ensuring user storage:", error);
  }
}

// Load all prompts
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

// Save all prompts
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

// Add a new prompt
const addPrompt = os.input(PromptSchema).handler(async ({ input }) => {
  try {
    await ensureUserStorage();
    const prompts = (await storage.getItem<Prompt[]>(USER_FILE_KEY)) || [];

    // Check if prompt with same ID already exists
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

// Update an existing prompt
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
      // Preserve existing recentlyUsedAt if it exists
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

// Delete a prompt
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

// Mark a prompt as recently used
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

// Generate icon and color suggestions
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

      console.log("Generating icon and title for prompt:", userPrompt);

      const result = await generateObject({
        model: openai("openai/gpt-4o-mini"),
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
