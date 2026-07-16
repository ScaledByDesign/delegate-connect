import type { StoredConnection } from "../../connection-service.ts";
import type { ResolvedCredential } from "../../core/types.ts";

/**
 * Scope parsed from a connection name by the `ws_admin_<service>` /
 * `ws_<workspaceId>_u_<userId>_<service>` / `ws_<workspaceId>_<service>` naming
 * conventions used by the Delegate app.
 */
export type LensConnectionScope = "admin" | "workspace" | "user" | "unknown";

/**
 * Coarse health status surfaced to the Delegate admin lens.
 *
 * The local connection store does not track verification history, so every
 * connection is reported as `unverified` until `POST
 * /api/admin/lens/connections/:service/verify` records otherwise.
 */
export type LensConnectionStatus = "healthy" | "stale" | "broken" | "unverified" | "unknown";

export interface LensConnection {
  service: string;
  connectionName: string;
  scope: LensConnectionScope;
  workspaceId: string | null;
  userId: string | null;
  authType: string;
  status: LensConnectionStatus;
  createdAt: string | null;
  updatedAt: string | null;
  lastUsedAt: string | null;
  lastVerifiedAt: string | null;
  lastError: string | null;
}

export interface ParsedConnectionName {
  scope: LensConnectionScope;
  workspaceId: string | null;
  userId: string | null;
}

/**
 * Parse `connectionName` against the Delegate naming convention.
 *
 * Service ids may themselves contain underscores (e.g. `cloudflare_dns`), so
 * the known service id is stripped as a suffix first and the remainder is
 * matched against `ws_admin`, `ws_<workspaceId>_u_<userId>`, and
 * `ws_<workspaceId>`.
 */
export function parseConnectionName(connectionName: string, service: string): ParsedConnectionName {
  const suffix = `_${service}`;
  if (!connectionName.endsWith(suffix)) {
    return { scope: "unknown", workspaceId: null, userId: null };
  }

  const prefix = connectionName.slice(0, connectionName.length - suffix.length);
  if (prefix === "ws_admin") {
    return { scope: "admin", workspaceId: null, userId: null };
  }

  const userMatch = /^ws_(.+)_u_(.+)$/.exec(prefix);
  if (userMatch) {
    return { scope: "user", workspaceId: userMatch[1] ?? null, userId: userMatch[2] ?? null };
  }

  const workspaceMatch = /^ws_(.+)$/.exec(prefix);
  if (workspaceMatch) {
    return { scope: "workspace", workspaceId: workspaceMatch[1] ?? null, userId: null };
  }

  return { scope: "unknown", workspaceId: null, userId: null };
}

/** Every stored connection is unverified until a lens verify call records otherwise. */
export function serializeLensConnection(connection: StoredConnection): LensConnection {
  const parsed = parseConnectionName(connection.connectionName, connection.service);
  return {
    service: connection.service,
    connectionName: connection.connectionName,
    scope: parsed.scope,
    workspaceId: parsed.workspaceId,
    userId: parsed.userId,
    authType: connection.credential.authType,
    status: "unverified",
    createdAt: null,
    updatedAt: null,
    lastUsedAt: null,
    lastVerifiedAt: null,
    lastError: null,
  };
}

export interface LensConnectionFilters {
  workspaceId?: string;
  userId?: string;
  service?: string;
  scope?: LensConnectionScope;
  status?: LensConnectionStatus;
  limit: number;
}

export function matchesLensFilters(connection: LensConnection, filters: LensConnectionFilters): boolean {
  if (filters.service !== undefined && connection.service !== filters.service) {
    return false;
  }
  if (filters.workspaceId !== undefined && connection.workspaceId !== filters.workspaceId) {
    return false;
  }
  if (filters.userId !== undefined && connection.userId !== filters.userId) {
    return false;
  }
  if (filters.scope !== undefined && connection.scope !== filters.scope) {
    return false;
  }
  if (filters.status !== undefined && connection.status !== filters.status) {
    return false;
  }
  return true;
}

export function summarizeLensTotals(connections: LensConnection[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const connection of connections) {
    totals[connection.status] = (totals[connection.status] ?? 0) + 1;
  }
  return totals;
}

export const lensConnectionLimitDefault = 100;
export const lensConnectionLimitMin = 1;
export const lensConnectionLimitMax = 500;

export function parseLensLimit(rawLimit: string | undefined): number {
  if (rawLimit === undefined) {
    return lensConnectionLimitDefault;
  }
  const parsed = Number(rawLimit);
  if (!Number.isFinite(parsed)) {
    return lensConnectionLimitDefault;
  }
  return Math.min(lensConnectionLimitMax, Math.max(lensConnectionLimitMin, Math.trunc(parsed)));
}

export function parseLensScope(rawScope: string | undefined): LensConnectionScope | undefined {
  return rawScope === "admin" || rawScope === "workspace" || rawScope === "user" || rawScope === "unknown"
    ? rawScope
    : undefined;
}

export function parseLensStatus(rawStatus: string | undefined): LensConnectionStatus | undefined {
  return rawStatus === "healthy" ||
    rawStatus === "stale" ||
    rawStatus === "broken" ||
    rawStatus === "unverified" ||
    rawStatus === "unknown"
    ? rawStatus
    : undefined;
}

/**
 * Response body for `GET /api/admin/credentials/:service`.
 *
 * Only the fields relevant to the connection's `authType` are populated —
 * `accessToken` for `oauth2`, `apiKey` for `api_key`, `values` for
 * `custom_credential`. Callers should check `authType` first.
 */
export interface AdminCredentialResponse {
  service: string;
  connectionName: string;
  authType: string;
  accessToken?: string;
  tokenType?: string;
  expiresAt?: string;
  apiKey?: string;
  values?: Record<string, string>;
  profile?: unknown;
  metadata?: Record<string, unknown>;
}

export function serializeAdminCredential(
  service: string,
  connectionName: string,
  credential: ResolvedCredential,
): AdminCredentialResponse {
  if (credential.authType === "no_auth") {
    return { service, connectionName, authType: credential.authType };
  }

  if (credential.authType === "oauth2") {
    return {
      service,
      connectionName,
      authType: credential.authType,
      accessToken: credential.accessToken,
      tokenType: credential.tokenType,
      expiresAt: credential.expiresAt,
      profile: credential.profile,
      metadata: credential.metadata,
    };
  }

  if (credential.authType === "api_key") {
    return {
      service,
      connectionName,
      authType: credential.authType,
      apiKey: credential.apiKey,
      profile: credential.profile,
      metadata: credential.metadata,
    };
  }

  return {
    service,
    connectionName,
    authType: credential.authType,
    values: credential.values,
    profile: credential.profile,
    metadata: credential.metadata,
  };
}
