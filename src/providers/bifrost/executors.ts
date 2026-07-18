import type { ExecutionContext, ProviderExecutors } from "../../core/types.ts";
import type { BifrostActionContext } from "./runtime.ts";

import { defineProviderExecutors, requireApiKeyCredential } from "../provider-runtime.ts";
import { bifrostActionHandlers, resolveBifrostBaseUrl } from "./runtime.ts";

const service = "bifrost";

export const executors: ProviderExecutors = defineProviderExecutors<BifrostActionContext>({
  service,
  handlers: bifrostActionHandlers,
  async createContext(context: ExecutionContext, fetcher: typeof fetch): Promise<BifrostActionContext> {
    const credential = await requireApiKeyCredential(context, service);
    return {
      apiKey: credential.apiKey,
      baseUrl: resolveBifrostBaseUrl({
        values: credential.values,
        metadata: credential.metadata,
      }),
      fetcher,
      signal: context.signal,
    };
  },
  fallbackMessage: "Bifrost request failed.",
});
