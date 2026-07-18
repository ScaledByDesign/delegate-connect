import type { DelegateAgentActionName } from "./actions.ts";

import { optionalRecord, optionalString } from "../../core/cast.ts";
import { assertPublicHttpUrl } from "../../core/request.ts";
import { providerUserAgent, ProviderRequestError } from "../provider-runtime.ts";

const defaultBaseUrl = "https://agent.delegate.ws";

export interface DelegateAgentActionContext {
  apiKey: string;
  baseUrl: string;
  fetcher: typeof fetch;
  signal?: AbortSignal;
}

interface DelegateAgentRequestInput {
  path: string;
  method?: string;
  body?: Record<string, unknown>;
}

type DelegateAgentActionHandler = (
  input: Record<string, unknown>,
  context: DelegateAgentActionContext,
) => Promise<unknown>;

export const delegateAgentActionHandlers: Record<DelegateAgentActionName, DelegateAgentActionHandler> = {
  list_groups(_input, context) {
    return requestDelegateAgent(context, { path: "/api/groups" });
  },
  list_agents(_input, context) {
    return requestDelegateAgent(context, { path: "/api/agents" });
  },
  get_health(_input, context) {
    return requestDelegateAgent(context, { path: "/api/health" });
  },
  build_container(input, context) {
    return requestDelegateAgent(context, {
      path: "/api/admin/build-container",
      method: "POST",
      body: optionalRecord(input) ?? {},
    });
  },
};

async function requestDelegateAgent(
  context: DelegateAgentActionContext,
  input: DelegateAgentRequestInput,
): Promise<unknown> {
  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${context.apiKey}`,
    "User-Agent": providerUserAgent,
  });

  let body: string | undefined;
  if (input.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(input.body);
  }

  const response = await context.fetcher(buildDelegateAgentUrl(context.baseUrl, input.path), {
    method: input.method ?? "GET",
    headers,
    body,
    signal: context.signal,
  });
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw toDelegateAgentError(response, payload);
  }
  return payload;
}

function buildDelegateAgentUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(path.replace(/^\/+/u, ""), base).toString();
}

export function resolveDelegateAgentBaseUrl(input: {
  values: Record<string, string>;
  metadata: Record<string, unknown>;
}): string {
  const configured = optionalString(input.metadata.baseUrl) ?? optionalString(input.values.baseUrl);
  return normalizeDelegateAgentBaseUrl(configured ?? defaultBaseUrl);
}

function normalizeDelegateAgentBaseUrl(value: string): string {
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

function toDelegateAgentError(response: Response, payload: unknown): ProviderRequestError {
  const record = optionalRecord(payload);
  const message =
    optionalString(record?.message) ??
    optionalString(record?.error) ??
    `DelegateAgent request failed with ${response.status}`;

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
