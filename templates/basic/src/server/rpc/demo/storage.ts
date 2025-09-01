import { call, os } from "@orpc/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createKV } from "../../lib/create-kv";

const DemoSchema = z.object({
  id: z.string(),
  value: z.string(),
});

type Demo = z.output<typeof DemoSchema>;

const kv = createKV<Demo>("demo");

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

const list = os.handler(async () => {
  return kv.getAllItems();
});

const live = {
  list: os.handler(async function* ({ signal }) {
    yield call(list, {}, { signal });
    for await (const _ of kv.publisher.subscribe("storage", {
      signal,
    })) {
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
