import type { ProviderDefinition } from "../../core/types.ts";

import { bifrostActions } from "./actions.ts";

const service = "bifrost";

/**
 * Bifrost provider backed by the DelegateAI Gateway at gateway.delegate.ws.
 *
 * The stored validation key is sent as the `x-bf-vk` header to gateway.delegate.ws.
 */
export const provider: ProviderDefinition = {
  service,
  displayName: "Bifrost",
  description: "DelegateAI Gateway access at gateway.delegate.ws, authenticated with an x-bf-vk validation key.",
  categories: ["Developer Tools"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "Validation Key (x-bf-vk)",
      placeholder: "bf_vk_xxx",
      description: "DelegateAI Gateway validation key sent as the x-bf-vk header to gateway.delegate.ws.",
      extraFields: [
        {
          key: "baseUrl",
          label: "Base URL",
          inputType: "text",
          required: false,
          secret: false,
          placeholder: "https://gateway.delegate.ws",
          description: "DelegateAI Gateway base URL. Defaults to https://gateway.delegate.ws when left blank.",
        },
      ],
    },
  ],
  homepageUrl: "https://gateway.delegate.ws",
  actions: bifrostActions,
};
