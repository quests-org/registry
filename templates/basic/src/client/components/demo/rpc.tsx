import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, rpcClient } from "@/client/rpc-client";

export function RPCDemo() {
  const [value, setValue] = useState("");

  // Live data query - automatically updates when server data changes
  // Use .experimental_liveOptions() for real-time subscriptions
  // Use .queryOptions() for static data that doesn't need live updates
  const { data: items } = useQuery(
    queryClient.demo.storage.live.list.experimental_liveOptions()
  );

  // Mutations handle data changes with loading states
  // Automatically invalidates related queries on success
  const { mutate: createItem, isPending: isCreatingItem } = useMutation(
    queryClient.demo.storage.create.mutationOptions()
  );

  return (
    <div>
      <h2>Storage Demo</h2>

      <div>
        <input
          placeholder="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          onClick={() => {
            if (value) {
              createItem({ value });
              setValue("");
            }
          }}
          disabled={isCreatingItem}
        >
          {isCreatingItem ? "Adding..." : "Add Item"}
        </button>
      </div>

      <div>
        <h3>Items:</h3>
        {items?.map((item) => (
          <div key={item.id}>
            {item.id}: {item.value}
            <button
              onClick={() => {
                // Direct RPC calls bypass React Query caching/mutations
                // Use for one-off operations or when you need immediate execution
                return rpcClient.demo.storage.remove(item.id);
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
