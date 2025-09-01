import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, rpcClient } from "../../rpc-client";

export function RPCDemo() {
  const [value, setValue] = useState("");

  const { data: items } = useQuery(
    queryClient.demo.storage.live.list.experimental_liveOptions()
  );

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
                // rpcClient can also call functions directly
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
