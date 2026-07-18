import type { ActionDefinition } from "../../core/types.ts";

import { s } from "../../core/json-schema.ts";
import { defineProviderAction } from "../../core/provider-definition.ts";

const service = "delegate_agent";

const emptyInput = s.object("The input payload for this action.", {});

const groupSchema = s.looseObject(
  {
    jid: s.string("Group JID identifier."),
    name: s.string("Group display name."),
    folder: s.string("Worktree folder associated with the group."),
    trigger: s.nullableString("Trigger keyword required to address the group, when configured."),
    added_at: s.nullableString("Timestamp when the group was added."),
    requiresTrigger: s.boolean("Whether messages must include the trigger to be handled."),
    isMain: s.boolean("Whether this is the main group."),
  },
  { description: "A DelegateAgent group record." },
);

const agentSchema = s.looseObject(
  {
    id: s.string("Agent identifier."),
    name: s.string("Agent display name."),
    role: s.string("Role assigned to the agent."),
    systemPrompt: s.string("System prompt configured for the agent."),
  },
  { description: "A DelegateAgent agent record." },
);

const groupsOutput = s.actionOutput(
  { groups: s.array("Groups registered with DelegateAgent.", groupSchema) },
  "A list of DelegateAgent groups.",
  ["groups"],
);

const agentsOutput = s.actionOutput(
  { agents: s.array("Agents configured in DelegateAgent.", agentSchema) },
  "A list of DelegateAgent agents.",
  ["agents"],
);

const healthOutput = s.looseObject(
  {
    ok: s.boolean("Whether the service reports healthy."),
    gitSha: s.string("Git commit SHA the running service was built from."),
    uptime: s.number("Process uptime in seconds."),
    worktreeCount: s.integer("Number of active worktrees."),
  },
  { description: "DelegateAgent health status." },
);

const buildContainerOutput = s.looseObject(
  {
    ok: s.boolean("Whether the build request was accepted."),
    message: s.string("Human-readable status message."),
  },
  { description: "Result of a DelegateAgent container build request." },
);

export const delegateAgentActions: ActionDefinition[] = [
  defineProviderAction(service, {
    name: "list_groups",
    description: "List the groups registered with the DelegateAgent instance.",
    requiredScopes: [],
    inputSchema: emptyInput,
    outputSchema: groupsOutput,
    followUpActions: ["delegate_agent.list_agents"],
  }),
  defineProviderAction(service, {
    name: "list_agents",
    description: "List the agents configured in the DelegateAgent instance.",
    requiredScopes: [],
    inputSchema: emptyInput,
    outputSchema: agentsOutput,
  }),
  defineProviderAction(service, {
    name: "get_health",
    description: "Get the health status of the DelegateAgent instance.",
    requiredScopes: [],
    inputSchema: emptyInput,
    outputSchema: healthOutput,
  }),
  defineProviderAction(service, {
    name: "build_container",
    description: "Trigger a container build via the DelegateAgent admin API.",
    requiredScopes: [],
    inputSchema: s.looseObject("Optional build options forwarded to the admin build endpoint.", {}),
    outputSchema: buildContainerOutput,
  }),
];

export type DelegateAgentActionName = "list_groups" | "list_agents" | "get_health" | "build_container";
