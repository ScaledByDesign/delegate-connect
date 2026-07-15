import type { StickyioActionName } from "./actions.ts";

import {
  compactObject,
  optionalBoolean,
  optionalInteger,
  optionalRecord,
  optionalString,
  requiredString,
  stringArray,
} from "../../core/cast.ts";
import { ProviderRequestError, providerUserAgent } from "../provider-runtime.ts";

const credentialHelpUrl = "https://support.sticky.io";

// Sticky.io response codes that represent a valid (possibly empty) result rather
// than an error: 100 = OK, 330/331 = order/customer find "no records", 602 =
// prospect find "no prospects found".
const emptyResultCodes = new Set(["100", "330", "331", "602"]);

type StickyioActionHandler = (input: Record<string, unknown>, context: StickyioActionContext) => Promise<unknown>;

export interface StickyioActionContext {
  appKey: string;
  username: string;
  password: string;
  fetcher: typeof fetch;
  signal?: AbortSignal;
}

interface StickyioEnvelope {
  response_code?: unknown;
  response_message?: unknown;
  [key: string]: unknown;
}

export const stickyioActionHandlers: Record<StickyioActionName, StickyioActionHandler> = {
  async list_orders(input, context) {
    const payload = await stickyioPost(context, "/order_find", {
      campaign_id: optionalString(input.campaignId) ?? "all",
      return_type: "order_view",
      ...findFilters(input),
    });
    return { orders: pickRecords(payload, "data", "orders"), raw: payload };
  },
  async get_order(input, context) {
    const orderIds = stringArray(input.orderIds, "orderIds", providerInputError);
    const payload = await stickyioPost(context, "/order_view", { order_id: orderIds });
    return { orders: pickOrderViewRecords(payload), raw: payload };
  },
  async list_customers(input, context) {
    const payload = await stickyioPost(context, "/customer_find", {
      campaign_id: optionalString(input.campaignId) ?? "all",
      return_type: "customer_view",
      ...findFilters(input),
    });
    return { customers: pickRecords(payload, "data", "customers"), raw: payload };
  },
  async get_customer(input, context) {
    const customerId = requiredString(input.customerId, "customerId", providerInputError);
    const payload = await stickyioPost(context, "/customer_view", { customer_id: customerId });
    return { customer: firstRecord(payload, "data"), raw: payload };
  },
  async list_products(input, context) {
    const productIds = optionalStringArray(input.productIds);
    const payload = await stickyioPost(context, "/product_index", {
      product_id: productIds && productIds.length > 0 ? productIds : ["all"],
    });
    return { products: pickRecords(payload, "products", "data"), raw: payload };
  },
  async list_campaigns(_input, context) {
    const payload = await stickyioPost(context, "/campaign_find_active", {});
    return { campaigns: pickRecords(payload, "data", "campaigns"), raw: payload };
  },
  async get_campaign(input, context) {
    const campaignId = requiredString(input.campaignId, "campaignId", providerInputError);
    const payload = await stickyioPost(context, "/campaign_view", { campaign_id: Number.parseInt(campaignId, 10) });
    return { campaign: firstRecord(payload, "data"), raw: payload };
  },
  async list_offers(input, context) {
    const body = compactObject({
      offer_id: optionalString(input.offerId),
      campaign_id: optionalString(input.campaignId),
    });
    const payload = await stickyioPost(context, "/offer_view", body);
    return { offers: pickRecords(payload, "data", "offers"), raw: payload };
  },
  async list_shipping_methods(input, context) {
    const payload = await stickyioPost(context, "/shipping_method_find", {
      campaign_id: optionalString(input.campaignId) ?? "all",
      search_type: "all",
      return_type: "shipping_method_view",
    });
    return { shippingMethods: pickRecords(payload, "data", "shipping_methods"), raw: payload };
  },
  async list_prospects(input, context) {
    const payload = await stickyioPost(context, "/prospect_find", {
      campaign_id: optionalString(input.campaignId) ?? "all",
      return_type: "prospect_view",
      ...findFilters(input),
    });
    return { prospects: pickRecords(payload, "data", "prospects"), raw: payload };
  },
  async get_prospect(input, context) {
    const prospectId = requiredString(input.prospectId, "prospectId", providerInputError);
    const payload = await stickyioPost(context, "/prospect_view", { prospect_id: prospectId });
    return { prospect: firstRecord(payload, "data"), raw: payload };
  },
  async refund_order(input, context) {
    const payload = await stickyioPost(context, "/order_refund", {
      order_id: requiredString(input.orderId, "orderId", providerInputError),
      amount: requiredString(input.amount, "amount", providerInputError),
      keep_recurring: optionalBoolean(input.keepRecurring) === true ? "1" : "0",
    });
    return { raw: payload };
  },
  async void_order(input, context) {
    const payload = await stickyioPost(context, "/order_void", {
      order_id: requiredString(input.orderId, "orderId", providerInputError),
    });
    return { raw: payload };
  },
};

export async function validateStickyioCredential(
  appKey: string,
  username: string,
  password: string,
  fetcher: typeof fetch,
  signal?: AbortSignal,
): Promise<{
  profile: { accountId: string; displayName: string; grantedScopes: string[] };
  metadata: Record<string, unknown>;
}> {
  const normalizedAppKey = normalizeAppKey(appKey);
  await stickyioPost({ appKey: normalizedAppKey, username, password, fetcher, signal }, "/validate_credentials", {});
  return {
    profile: {
      accountId: `stickyio:${normalizedAppKey}`,
      displayName: `${normalizedAppKey}.sticky.io`,
      grantedScopes: [],
    },
    metadata: {
      appKey: normalizedAppKey,
      apiBaseUrl: buildStickyioApiBaseUrl(normalizedAppKey),
      credentialHelpUrl,
    },
  };
}

export function normalizeAppKey(value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new ProviderRequestError(400, "appKey is required");
  }

  let host = trimmed;
  if (trimmed.includes("://")) {
    try {
      host = new URL(trimmed).hostname;
    } catch {
      throw new ProviderRequestError(400, "appKey must be a Sticky.io subdomain or URL");
    }
  } else {
    host = trimmed.split("/")[0] ?? "";
  }

  // Accept either a bare subdomain ("acme") or a full host ("acme.sticky.io").
  const subdomain = host.toLowerCase().replace(/\.sticky\.io$/u, "");
  if (!/^[a-z0-9][a-z0-9-]*$/u.test(subdomain)) {
    throw new ProviderRequestError(400, "appKey must be a valid Sticky.io subdomain");
  }
  return subdomain;
}

export function buildStickyioApiBaseUrl(appKey: string): string {
  return `https://${appKey}.sticky.io/api/v1`;
}

/**
 * Normalize a date for Sticky.io, which requires m/d/yyyy. Accepts ISO
 * yyyy-mm-dd (optionally with a time component) or an already-m/d/yyyy string.
 */
export function toStickyioDate(value: string | undefined): string | undefined {
  const trimmed = optionalString(value);
  if (!trimmed) {
    return undefined;
  }
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/u);
  if (iso) {
    return `${Number.parseInt(iso[2]!, 10)}/${Number.parseInt(iso[3]!, 10)}/${iso[1]}`;
  }
  return trimmed;
}

async function stickyioPost(
  context: StickyioActionContext,
  path: string,
  body: Record<string, unknown>,
): Promise<StickyioEnvelope> {
  const url = `${buildStickyioApiBaseUrl(context.appKey)}${path}`;
  const encoded = btoa(`${context.username}:${context.password}`);
  const response = await context.fetcher(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": providerUserAgent,
      authorization: `Basic ${encoded}`,
    },
    body: JSON.stringify(body),
    signal: context.signal,
  });

  const payload = await readStickyioJson(response, !response.ok);
  if (!response.ok) {
    throw new ProviderRequestError(
      response.status,
      `stickyio request to ${path} failed with HTTP ${response.status}`,
      payload,
    );
  }

  const code = optionalString(payload.response_code === undefined ? undefined : String(payload.response_code));
  if (code !== undefined && !emptyResultCodes.has(code)) {
    const message = optionalString(payload.response_message) ?? `Sticky.io error code ${code}`;
    const status = code === "1004" || code === "401" ? 401 : 502;
    throw new ProviderRequestError(status, `stickyio ${path}: ${message}`, payload);
  }
  return payload;
}

async function readStickyioJson(response: Response, allowInvalidJson: boolean): Promise<StickyioEnvelope> {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text) as StickyioEnvelope;
  } catch {
    if (allowInvalidJson) {
      return {};
    }
    throw new ProviderRequestError(502, "stickyio returned invalid JSON");
  }
}

function findFilters(input: Record<string, unknown>): Record<string, unknown> {
  return compactObject({
    start_date: toStickyioDate(optionalString(input.startDate)),
    end_date: toStickyioDate(optionalString(input.endDate)),
    search_type: optionalString(input.searchType),
    search_value: optionalString(input.searchValue),
    page_num: optionalInteger(input.pageNum),
    per_page: optionalInteger(input.perPage),
  });
}

function collectRecords(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => optionalRecord(item) !== undefined);
  }
  const record = optionalRecord(value);
  if (!record) {
    return [];
  }
  return Object.values(record).filter(
    (item): item is Record<string, unknown> => optionalRecord(item) !== undefined,
  );
}

function pickRecords(payload: StickyioEnvelope, ...keys: string[]): Array<Record<string, unknown>> {
  for (const key of keys) {
    const records = collectRecords(payload[key]);
    if (records.length > 0) {
      return records;
    }
  }
  return [];
}

// order_view returns either a keyed `data: { "<id>": {...} }` map or a single
// flat order object at the envelope root when only one id is requested.
function pickOrderViewRecords(payload: StickyioEnvelope): Array<Record<string, unknown>> {
  const keyed = collectRecords(payload.data);
  if (keyed.length > 0) {
    return keyed;
  }
  if (optionalString(payload.order_id) !== undefined) {
    return [payload];
  }
  return [];
}

function firstRecord(payload: StickyioEnvelope, key: string): Record<string, unknown> | null {
  const records = collectRecords(payload[key]);
  return records[0] ?? null;
}

function optionalStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? stringArray(value, "productIds", providerInputError) : undefined;
}

function providerInputError(message: string): ProviderRequestError {
  return new ProviderRequestError(400, message);
}
