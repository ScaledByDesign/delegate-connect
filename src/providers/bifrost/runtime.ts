import type { BifrostActionName } from "./actions.ts";

import { optionalRecord, optionalString, requiredString } from "../../core/cast.ts";
import { assertPublicHttpUrl } from "../../core/request.ts";
import { providerUserAgent, ProviderRequestError } from "../provider-runtime.ts";

const defaultBaseUrl = "https://gateway.delegate.ws";

export interface BifrostActionContext {
  apiKey: string;
  baseUrl: string;
  fetcher: typeof fetch;
  signal?: AbortSignal;
}

interface BifrostRequestInput {
  path: string;
  method?: string;
  body?: Record<string, unknown>;
}

type BifrostActionHandler = (input: Record<string, unknown>, context: BifrostActionContext) => Promise<unknown>;

export const bifrostActionHandlers: Record<BifrostActionName, BifrostActionHandler> = {
  list_models(_input, context) {
    return requestBifrost(context, { path: "/v1/models" });
  },
  chat_completions(input, context) {
    return requestBifrost(context, {
      path: "/v1/chat/completions",
      method: "POST",
      body: buildChatCompletionsBody(input),
    });
  },
};

function buildChatCompletionsBody(input: Record<string, unknown>): Record<string, unknown> {
  const body = optionalRecord(input) ?? {};
  requiredString(body.model, "model", (message) => new ProviderRequestError(400, message));
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    throw new ProviderRequestError(400, "messages must be a non-empty array");
  }
  return body;
}

async function requestBifrost(context: BifrostActionContext, input: BifrostRequestInput): Promise<unknown> {
  const headers = new Headers({
    Accept: "application/json",
    "x-bf-vk": context.apiKey,
    "User-Agent": providerUserAgent,
  });

  let body: string | undefined;
  if (input.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(input.body);
  }

  const response = await context.fetcher(buildBifrostUrl(context.baseUrl, input.path), {
    method: input.method ?? "GET",
    headers,
    body,
    signal: context.signal,
  });
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw toBifrostError(response, payload);
  }
  return payload;
}

function buildBifrostUrl(baseUrl: string, path: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(path.replace(/^\/+/u, ""), base).toString();
}

export function resolveBifrostBaseUrl(input: {
  values: Record<string, string>;
  metadata: Record<string, unknown>;
}): string {
  const configured = optionalString(input.metadata.baseUrl) ?? optionalString(input.values.baseUrl);
  return normalizeBifrostBaseUrl(configured ?? defaultBaseUrl);
}

function normalizeBifrostBaseUrl(value: string): string {
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

function toBifrostError(response: Response, payload: unknown): ProviderRequestError {
  const record = optionalRecord(payload);
  const errorRecord = optionalRecord(record?.error);
  const message =
    optionalString(errorRecord?.message) ??
    optionalString(record?.message) ??
    optionalString(record?.error) ??
    `Bifrost request failed with ${response.status}`;

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
