import { os, type } from "@orpc/server";
import fsDriver from "unstorage/drivers/fs";
import { createStorage } from "unstorage";
const fileStorage = createStorage({
  driver: fsDriver({ base: "./files.local" }),
});
const base = os.errors({
  FILE_NOT_FOUND: {},
});
export interface UploadedFileMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  previewUrl?: string;
}

export interface UploadedFile extends UploadedFileMetadata {
  buffer: Buffer;
}
const create = base.input(type<{ file: File }>()).handler(async ({ input }) => {
  const id = crypto.randomUUID();
  const buffer = await input.file.arrayBuffer();
  await fileStorage.setItemRaw(id, Buffer.from(buffer));
  await fileStorage.setMeta(id, {
    name: input.file.name,
    type: input.file.type,
    size: input.file.size,
  });
  return id;
});
const get = base
  .input(type<{ id: string }>())
  .output(type<UploadedFile>())
  .handler(async ({ errors, input }) => {
    const file = await fileStorage.getItemRaw(input.id);
    if (!file) {
      throw errors.FILE_NOT_FOUND();
    }
    const metadata = (await fileStorage.getMeta(input.id)) as {
      name: string;
      type: string;
      size: number;
    };

    return { buffer: file, ...metadata, id: input.id };
  });
const list = base.output(type<UploadedFileMetadata[]>()).handler(async () => {
  const fileKeys = await fileStorage.getKeys();
  const files = await Promise.all(
    fileKeys.map(async (file) => {
      const metadata = (await fileStorage.getMeta(file)) as {
        name: string;
        type: string;
        size: number;
      };

      let previewUrl;
      if (metadata.size < 1024 * 1024 && metadata.type.startsWith("image/")) {
        const fileData = await fileStorage.getItemRaw(file);
        const base64 = fileData.toString("base64");
        previewUrl = `data:${metadata.type};base64,${base64}`;
      }

      return {
        id: file,
        ...metadata,
        previewUrl,
      };
    })
  );

  return files;
});
const remove = base.input(type<{ id: string }>()).handler(async ({ input }) => {
  await fileStorage.removeItem(input.id);
});

export const fileRouter = {
  create,
  get,
  remove,
  list,
};
