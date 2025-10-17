import { jsonrepair } from "jsonrepair";
import { z } from "zod";
import { makeParseableResponseFormat } from "openai/lib/parser";

import type { AutoParseableResponseFormat } from "openai/lib/parser";
import type { ResponseFormatJSONSchema } from "openai/resources";

export function zodResponseFormat<ZodInput extends z.ZodType>(
  zodObject: ZodInput,
  name: string,
  props?: Omit<
    ResponseFormatJSONSchema.JSONSchema,
    "schema" | "strict" | "name"
  >
): AutoParseableResponseFormat<z.infer<ZodInput>> {
  return makeParseableResponseFormat(
    {
      type: "json_schema",
      json_schema: {
        ...props,
        name,
        strict: true,
        schema: z.toJSONSchema(zodObject, { target: "draft-7" }),
      },
    },
    (content) => zodObject.parse(JSON.parse(jsonrepair(content)))
  );
}
