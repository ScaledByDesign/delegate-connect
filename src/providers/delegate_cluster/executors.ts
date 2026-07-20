import type { ExecutionContext, ProviderExecutors } from "../../core/types.ts";
import type { DelegateClusterActionContext } from "./runtime.ts";

import { defineProviderExecutors, requireApiKeyCredential } from "../provider-runtime.ts";
import { delegateClusterActionHandlers, resolveDelegateClusterBaseUrl } from "./runtime.ts";

const service = "delegate_cluster";

export const executors: ProviderExecutors = defineProviderExecutors<DelegateClusterActionContext>({
  service,
  handlers: delegateClusterActionHandlers,
  async createContext(context: ExecutionContext, fetcher: typeof fetch): Promise<DelegateClusterActionContext> {
    const credential = await requireApiKeyCredential(context, service);
    return {
      apiKey: credential.apiKey,
      baseUrl: resolveDelegateClusterBaseUrl({
        values: credential.values,
        metadata: credential.metadata,
      }),
      fetcher,
      signal: context.signal,
    };
  },
  fallbackMessage: "DelegateCluster request failed.",
});
