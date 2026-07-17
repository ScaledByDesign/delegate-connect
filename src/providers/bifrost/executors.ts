import type { ProviderExecutors } from "../../core/types.ts";

import { defineApiKeyProviderExecutors } from "../provider-runtime.ts";

const service = "bifrost";

export const executors: ProviderExecutors = defineApiKeyProviderExecutors(service, {});
