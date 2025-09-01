import { createStorage, StorageValue, WatchEvent } from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import { EventPublisher } from "@orpc/server";

const STORAGE_PATH = "./.storage"; // It is .gitignored

export function createKV<T extends StorageValue>(name: string) {
  const storage = createStorage<T>({
    driver: fsDriver({ base: `${STORAGE_PATH}/${name}` }),
  });
  const publisher = new EventPublisher<{
    storage: { event: WatchEvent; key: string };
  }>();
  storage.watch((event, key) => {
    console.log("storage", event, key);
    publisher.publish("storage", { event, key });
  });
  return {
    ...storage,
    getAllItems: async () => {
      const keys = await storage.getKeys();
      const values = await storage.getItems(keys);
      return values.map(({ value }) => value);
    },
    publisher,
  };
}
