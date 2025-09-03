import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { router } from "@/server/rpc";

const link = new RPCLink({ url: `${window.location.origin}/rpc` });

export const rpcClient: RouterClient<typeof router> = createORPCClient(link);

export const queryClient = createTanstackQueryUtils(rpcClient);
