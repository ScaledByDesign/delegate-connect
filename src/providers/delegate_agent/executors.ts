import type { ProviderExecutors } from "../../core/types.ts";

import { defineApiKeyProviderExecutors } from "../provider-runtime.ts";

const service = "delegate_agent";

export const executors: ProviderExecutors = defineApiKeyProviderExecutors(service, {});
