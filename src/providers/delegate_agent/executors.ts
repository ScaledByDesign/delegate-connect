import type { ExecutionContext, ProviderExecutors } from "../../core/types.ts";
import type { DelegateAgentActionContext } from "./runtime.ts";

import { defineProviderExecutors, requireApiKeyCredential } from "../provider-runtime.ts";
import { delegateAgentActionHandlers, resolveDelegateAgentBaseUrl } from "./runtime.ts";

const service = "delegate_agent";

export const executors: ProviderExecutors = defineProviderExecutors<DelegateAgentActionContext>({
  service,
  handlers: delegateAgentActionHandlers,
  async createContext(context: ExecutionContext, fetcher: typeof fetch): Promise<DelegateAgentActionContext> {
    const credential = await requireApiKeyCredential(context, service);
    return {
      apiKey: credential.apiKey,
      baseUrl: resolveDelegateAgentBaseUrl({
        values: credential.values,
        metadata: credential.metadata,
      }),
      fetcher,
      signal: context.signal,
    };
  },
  fallbackMessage: "DelegateAgent request failed.",
});
