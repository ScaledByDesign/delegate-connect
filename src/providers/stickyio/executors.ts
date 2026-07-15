import type {
  CredentialValidators,
  ExecutionContext,
  ProviderExecutors,
  ProviderProxyExecutor,
} from "../../core/types.ts";

import { optionalString } from "../../core/cast.ts";
import {
  defineProviderExecutors,
  defineProviderProxy,
  ProviderRequestError,
  requireApiKeyCredential,
} from "../provider-runtime.ts";
import {
  buildStickyioApiBaseUrl,
  normalizeAppKey,
  stickyioActionHandlers,
  validateStickyioCredential,
} from "./runtime.ts";

const service = "stickyio";

export const executors: ProviderExecutors = defineProviderExecutors({
  service,
  handlers: stickyioActionHandlers,
  async createContext(context: ExecutionContext, fetcher: typeof fetch) {
    const credential = await requireApiKeyCredential(context, service);
    const appKey = normalizeAppKey(optionalString(credential.values.appKey));
    const username = optionalString(credential.values.username);
    if (!username) {
      throw new ProviderRequestError(400, "username is required");
    }
    return {
      appKey,
      username,
      password: credential.apiKey,
      fetcher,
      signal: context.signal,
    };
  },
  fallbackMessage: "stickyio request failed",
});

export const proxy: ProviderProxyExecutor = defineProviderProxy({
  service,
  baseUrl: async (context) => {
    const credential = await requireApiKeyCredential(context, service);
    return buildStickyioApiBaseUrl(normalizeAppKey(optionalString(credential.values.appKey)));
  },
  auth: { type: "none" },
  async customizeRequest({ context, headers }) {
    const credential = await requireApiKeyCredential(context, service);
    const username = optionalString(credential.values.username);
    if (!username) {
      throw new ProviderRequestError(400, "username is required");
    }
    headers.set("authorization", `Basic ${btoa(`${username}:${credential.apiKey}`)}`);
  },
});

export const credentialValidators: CredentialValidators = {
  async apiKey(input, { fetcher, signal }) {
    const appKey = optionalString(input.values.appKey);
    const username = optionalString(input.values.username);
    if (!appKey) {
      throw new ProviderRequestError(400, "appKey is required");
    }
    if (!username) {
      throw new ProviderRequestError(400, "username is required");
    }
    return validateStickyioCredential(appKey, username, input.apiKey, fetcher, signal);
  },
};
