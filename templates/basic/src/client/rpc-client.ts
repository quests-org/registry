import type {
  InferRouterInputs,
  InferRouterOutputs,
  RouterClient,
} from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { router } from "../server/rpc";

const link = new RPCLink({ url: `${window.location.origin}/rpc` });

export const rpcClient: RouterClient<typeof router> = createORPCClient(link);

export const queryClient = createTanstackQueryUtils(rpcClient);

// Use to access the typed inputs and outputs of the server
export type Outputs = InferRouterOutputs<typeof router>;
export type Inputs = InferRouterInputs<typeof router>;
