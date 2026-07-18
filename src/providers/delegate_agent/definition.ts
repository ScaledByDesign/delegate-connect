import type { ProviderDefinition } from "../../core/types.ts";

import { delegateAgentActions } from "./actions.ts";

const service = "delegate_agent";

/**
 * DelegateAgent admin provider backed by the agent.delegate.ws admin API.
 *
 * The stored bearer token is sent as `Authorization: Bearer <token>` to
 * `agent.delegate.ws/api/admin/*` endpoints such as POST /api/admin/build-container.
 */
export const provider: ProviderDefinition = {
  service,
  displayName: "DelegateAgent",
  description: "Admin access to the DelegateAgent API at agent.delegate.ws for container and admin operations.",
  categories: ["Developer Tools"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "Admin Bearer Token",
      placeholder: "delegate_agent_admin_token",
      description:
        "DelegateAgent admin bearer token sent as the Authorization: Bearer header to agent.delegate.ws/api/admin/* endpoints.",
      extraFields: [
        {
          key: "baseUrl",
          label: "Base URL",
          inputType: "text",
          required: false,
          secret: false,
          placeholder: "https://agent.delegate.ws",
          description: "DelegateAgent API base URL. Defaults to https://agent.delegate.ws when left blank.",
        },
      ],
    },
  ],
  homepageUrl: "https://agent.delegate.ws",
  actions: delegateAgentActions,
};
