import { call, os } from "@orpc/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createKV } from "@/server/lib/create-kv";

const DemoSchema = z.object({
  id: z.string(),
  value: z.string(),
});

type Demo = z.output<typeof DemoSchema>;

// createKV provides simple key-value storage with publisher/subscriber support
// perfect for live queries and small amounts of data
const kv = createKV<Demo>("demo");

// Handler with input validation using .input() and schema
const create = os
  .input(DemoSchema.omit({ id: true }))
  .handler(async ({ input }) => {
    const id = randomUUID();
    const item = { id, value: input.value };
    await kv.setItem(id, item);
  });

const remove = os.input(z.string()).handler(async ({ input }) => {
  await kv.removeItem(input);
});

// Handler without input - returns all items
const list = os.handler(async () => {
  return kv.getAllItems();
});

// Live data stream using generator function
// Yields initial data, then subscribes to changes for real-time updates
const live = {
  list: os.handler(async function* ({ signal }) {
    yield call(list, {}, { signal });
    for await (const _ of kv.subscribe()) {
      yield call(list, {}, { signal });
    }
  }),
};

export const router = {
  create,
  remove,
  list,
  live,
};
