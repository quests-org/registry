import { os } from "@orpc/server";

export const models = os.handler(async () => {
  try {
    const response = await fetch(`${process.env.OPENAI_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch models: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as { data: { id: string }[] };

    return data.data.map((model) => ({
      name: model.id,
      value: model.id,
    }));
  } catch (error) {
    console.error("Error fetching models:", error);
    return [];
  }
});
