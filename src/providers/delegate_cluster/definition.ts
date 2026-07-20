import type { ProviderDefinition } from "../../core/types.ts";

import { delegateClusterActions } from "./actions.ts";

const service = "delegate_cluster";

/**
 * DelegateCluster provider backed by the DelegateCluster MCP (clawd-mcp) at
 * cluster.delegate.ws.
 *
 * The service exposes a custom REST tool-call API rather than standard MCP
 * JSON-RPC: every action is invoked with `POST {baseUrl}/call_tool` and a body
 * of `{"tool":"<name>","params":{...}}`, authenticated with the stored token as
 * `Authorization: Bearer <token>` (the CLAWDLINUX_MCP_TOKEN).
 */
export const provider: ProviderDefinition = {
  service,
  displayName: "DelegateCluster",
  description: "Manage DelegateCluster agent workloads via the clawd-mcp tool-call API at cluster.delegate.ws.",
  categories: ["Developer Tools"],
  authTypes: ["api_key"],
  auth: [
    {
      type: "api_key",
      label: "MCP Bearer Token",
      placeholder: "clawdlinux_mcp_token",
      description:
        "DelegateCluster MCP token (CLAWDLINUX_MCP_TOKEN) sent as the Authorization: Bearer header to cluster.delegate.ws/call_tool.",
      extraFields: [
        {
          key: "baseUrl",
          label: "Base URL",
          inputType: "text",
          required: false,
          secret: false,
          placeholder: "https://cluster.delegate.ws",
          description: "DelegateCluster MCP base URL. Defaults to https://cluster.delegate.ws when left blank.",
        },
      ],
    },
  ],
  homepageUrl: "https://cluster.delegate.ws",
  actions: delegateClusterActions,
};
