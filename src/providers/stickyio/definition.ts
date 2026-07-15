import type { ProviderDefinition } from "../../core/types.ts";

import { stickyioActions } from "./actions.ts";

const service = "stickyio";

/**
 * Sticky.io provider backed by the Sticky.io subscription/recurring-billing API.
 *
 * Sticky.io authenticates with HTTP Basic auth (API username + password) and is
 * addressed per-store via the subdomain, so the built-in `apiKey` credential
 * holds the API password while the username and store subdomain are collected as
 * extra fields.
 */
export const provider: ProviderDefinition = {
  service,
  displayName: "Sticky.io",
  categories: ["Marketing", "Data"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "API password",
      placeholder: "••••••••",
      description:
        "Sticky.io API user password. Combined with the API username it is sent as HTTP Basic auth. Create an API user under Settings → API Users in your Sticky.io admin: https://support.sticky.io",
      extraFields: [
        {
          key: "username",
          label: "API username",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "api-user",
          description: "The Sticky.io API username paired with the API password for Basic authentication.",
        },
        {
          key: "appKey",
          label: "Store subdomain",
          inputType: "text",
          required: true,
          secret: false,
          placeholder: "acme",
          description:
            "Your Sticky.io store subdomain — the {appKey} in https://{appKey}.sticky.io. For example, enter acme for acme.sticky.io.",
        },
      ],
    },
  ],
  homepageUrl: "https://www.sticky.io",
  actions: stickyioActions,
};
