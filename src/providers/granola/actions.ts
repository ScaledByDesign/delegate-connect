import type { ActionDefinition, JsonSchema } from "../../core/types.ts";

import { defineProviderAction } from "../../core/provider-definition.ts";
import { granolaGeneratedActionSchemas } from "./generated.ts";

const service = "granola";

export type GranolaActionName = (typeof granolaGeneratedActionSchemas)[number]["name"];

export const granolaActions: ActionDefinition[] = granolaGeneratedActionSchemas.map((actionSchema) =>
  defineProviderAction(service, {
    name: actionSchema.name,
    description: actionSchema.description,
    requiredScopes: actionSchema.requiredScopes,
    providerPermissions: actionSchema.providerPermissions,
    inputSchema: actionSchema.inputSchema as JsonSchema,
    outputSchema: actionSchema.outputSchema as JsonSchema,
  }),
);
