import type { DelegateClusterActionName } from "./actions.ts";

import { optionalRecord, optionalString, requiredString } from "../../core/cast.ts";
import { assertPublicHttpUrl } from "../../core/request.ts";
import { providerUserAgent, ProviderRequestError } from "../provider-runtime.ts";

const defaultBaseUrl = "https://cluster.delegate.ws";

export interface DelegateClusterActionContext {
  apiKey: string;
  baseUrl: string;
  fetcher: typeof fetch;
  signal?: AbortSignal;
}

type DelegateClusterActionHandler = (
  input: Record<string, unknown>,
  context: DelegateClusterActionContext,
) => Promise<unknown>;

export const delegateClusterActionHandlers: Record<DelegateClusterActionName, DelegateClusterActionHandler> = {
  list_workloads(input, context) {
    return callTool(context, "list_workloads", optionalRecord(input) ?? {});
  },
  create_workload(input, context) {
    const params = optionalRecord(input) ?? {};
    requiredString(params.name, "name", (message) => new ProviderRequestError(400, message));
    requiredString(params.objective, "objective", (message) => new ProviderRequestError(400, message));
    if (!Array.isArray(params.agents) || params.agents.length === 0) {
      throw new ProviderRequestError(400, "agents must be a non-empty array");
    }
    return callTool(context, "create_workload", params);
  },
  get_workload_status(input, context) {
    return callTool(context, "get_workload_status", requireNamedWorkload(input));
  },
  get_workload_logs(input, context) {
    return callTool(context, "get_workload_logs", requireNamedWorkload(input));
  },
  get_workload_cost(input, context) {
    return callTool(context, "get_workload_cost", requireNamedWorkload(input));
  },
  delete_workload(input, context) {
    return callTool(context, "delete_workload", requireNamedWorkload(input));
  },
};

function requireNamedWorkload(input: Record<string, unknown>): Record<string, unknown> {
  const params = optionalRecord(input) ?? {};
  requiredString(params.name, "name", (message) => new ProviderRequestError(400, message));
  return params;
}

async function callTool(
  context: DelegateClusterActionContext,
  tool: string,
  params: Record<string, unknown>,
): Promise<unknown> {
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${context.apiKey}`,
    "User-Agent": providerUserAgent,
  });

  const response = await context.fetcher(buildDelegateClusterUrl(context.baseUrl, "/call_tool"), {
    method: "POST",
    headers,
    body: JSON.stringify({ tool, params }),
    signal: context.signal,
  });
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw toDelegateClusterError(response, payload);
  }
  return payload;
}

function buildDelegateClusterUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(path.replace(/^\/+/u, ""), base).toString();
}

export function resolveDelegateClusterBaseUrl(input: {
  values: Record<string, string>;
  metadata: Record<string, unknown>;
}): string {
  const configured = optionalString(input.metadata.baseUrl) ?? optionalString(input.values.baseUrl);
  return normalizeDelegateClusterBaseUrl(configured ?? defaultBaseUrl);
}

function normalizeDelegateClusterBaseUrl(value: string): string {
  const parsed = assertPublicHttpUrl(value.trim(), {
    fieldName: "baseUrl",
    createError: (message) => new ProviderRequestError(400, message),
  });
  if (parsed.protocol !== "https:") {
    throw new ProviderRequestError(400, "Base URL must use https");
  }
  parsed.search = "";
  parsed.hash = "";
  let pathname = parsed.pathname;
  while (pathname.endsWith("/") && pathname !== "/") {
    pathname = pathname.slice(0, -1);
  }
  return `${parsed.origin}${pathname === "/" ? "" : pathname}`;
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

function toDelegateClusterError(response: Response, payload: unknown): ProviderRequestError {
  const record = optionalRecord(payload);
  const message =
    optionalString(record?.error) ??
    optionalString(record?.message) ??
    `DelegateCluster request failed with ${response.status}`;

  if (response.status === 401 || response.status === 403) {
    return new ProviderRequestError(response.status, message, payload);
  }
  if (response.status === 429) {
    return new ProviderRequestError(429, message, payload);
  }
  if (response.status < 500) {
    return new ProviderRequestError(response.status || 400, message, payload);
  }
  return new ProviderRequestError(response.status || 502, message, payload);
}
