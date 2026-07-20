import type { ActionDefinition, JsonSchema } from "../../core/types.ts";

import { s } from "../../core/json-schema.ts";
import { defineProviderAction } from "../../core/provider-definition.ts";

const service = "delegate_cluster";

/** Wrap a per-action `result` payload in the clawd-mcp tool-call envelope. */
function toolEnvelope(description: string, result: JsonSchema): JsonSchema {
  return s.looseObject(description, {
    tool: s.string("The tool name that was invoked."),
    result,
    success: s.boolean("Whether the tool call succeeded."),
    error: s.nullableString("Error message returned when success is false."),
  });
}

const workloadItemSchema = s.looseObject(
  {
    name: s.string("Workload name."),
    namespace: s.string("Kubernetes namespace the workload runs in."),
    status: s.string("Current workload status."),
    age: s.string("Human-readable age of the workload."),
    model: s.string("Model in use for the workload."),
    costToday: s.string("Cost accrued by the workload today."),
  },
  { description: "A DelegateCluster workload summary." },
);

const listWorkloadsOutput = toolEnvelope(
  "List of DelegateCluster workloads.",
  s.looseObject(
    {
      count: s.integer("Number of workloads returned."),
      items: s.array("The matching workloads.", workloadItemSchema),
    },
    { description: "The matched workloads and their count." },
  ),
);

const createWorkloadOutput = toolEnvelope(
  "The newly created DelegateCluster workload.",
  s.looseObject(
    {
      name: s.string("Workload name."),
      namespace: s.string("Namespace the workload was created in."),
      phase: s.string("Initial workload phase."),
      uid: s.string("Kubernetes object UID."),
      resourceVersion: s.string("Kubernetes resource version."),
    },
    { description: "Identifiers for the created workload." },
  ),
);

const statusOutput = toolEnvelope(
  "Status of a DelegateCluster workload.",
  s.looseObject({ phase: s.string("Current workload phase.") }, { description: "Workload phase and workflow steps." }),
);

const logsOutput = toolEnvelope(
  "Logs from the main container of a DelegateCluster workload.",
  s.string("The main-container log output."),
);

const costOutput = toolEnvelope(
  "Cost breakdown for a DelegateCluster workload.",
  s.looseObject({}, { description: "Per-workload token counts and USD cost." }),
);

const deleteOutput = toolEnvelope(
  "Result of deleting a DelegateCluster workload.",
  s.looseObject(
    { deleted: s.boolean("Whether a workload was deleted (false when it did not exist).") },
    { description: "Idempotent deletion result." },
  ),
);

export const delegateClusterActions: ActionDefinition[] = [
  defineProviderAction(service, {
    name: "list_workloads",
    description: "List DelegateCluster agent workloads, optionally filtered by namespace and label selector.",
    requiredScopes: [],
    inputSchema: s.object(
      {
        namespace: s.string("Namespace to list workloads from. Omit to list across the default scope."),
        labelSelector: s.string("Kubernetes label selector to filter workloads."),
      },
      { optional: ["namespace", "labelSelector"], description: "Filters for listing workloads." },
    ),
    outputSchema: listWorkloadsOutput,
    followUpActions: ["delegate_cluster.get_workload_status"],
  }),
  defineProviderAction(service, {
    name: "create_workload",
    description: "Create a new DelegateCluster agent workload.",
    requiredScopes: [],
    inputSchema: s.object(
      {
        name: s.string({ minLength: 1, description: "Workload name (DNS-1123 compliant)." }),
        objective: s.string({ minLength: 1, maxLength: 1000, description: "Objective for the workload." }),
        agents: s.stringArray("Agents assigned to the workload.", { minItems: 1 }),
        namespace: s.string("Namespace to create the workload in."),
        workflowName: s.string({ default: "research-swarm", description: "Argo workflow template name." }),
        workloadType: s.stringEnum("Workload type.", ["generic", "ceph", "minio", "postgres", "aws", "kubernetes"]),
        opaPolicy: s.stringEnum("OPA policy mode.", ["strict", "permissive"]),
        modelStrategy: s.string({ default: "fixed", description: "Model selection strategy." }),
        collaborationMode: s.string({ default: "solo", description: "Agent collaboration mode." }),
        taskClassifier: s.string({ default: "default", description: "Task classifier to use." }),
        targetUrls: s.stringArray("Target URLs the workload may act on."),
        mcpServerEndpoint: s.string("MCP server endpoint override for the workload."),
        autoApproveThreshold: s.string('Auto-approve confidence threshold, e.g. "0.95".'),
      },
      {
        required: ["name", "objective", "agents"],
        description: "Configuration for the new workload.",
      },
    ),
    outputSchema: createWorkloadOutput,
    followUpActions: ["delegate_cluster.get_workload_status"],
  }),
  defineProviderAction(service, {
    name: "get_workload_status",
    description: "Get the status and workflow steps of a DelegateCluster workload.",
    requiredScopes: [],
    inputSchema: s.object(
      {
        name: s.string({ minLength: 1, description: "Workload name." }),
        namespace: s.string("Namespace the workload runs in."),
      },
      { required: ["name"], description: "Target workload." },
    ),
    outputSchema: statusOutput,
  }),
  defineProviderAction(service, {
    name: "get_workload_logs",
    description: "Get the main-container logs of a DelegateCluster workload.",
    requiredScopes: [],
    inputSchema: s.object(
      {
        name: s.string({ minLength: 1, description: "Workload name." }),
        namespace: s.string({ default: "argo-workflows", description: "Namespace the workload runs in." }),
        tail: s.integer({ default: 100, description: "Number of trailing log lines to return." }),
      },
      { required: ["name"], description: "Target workload and log options." },
    ),
    outputSchema: logsOutput,
  }),
  defineProviderAction(service, {
    name: "get_workload_cost",
    description: "Get the token and USD cost of a DelegateCluster workload.",
    requiredScopes: [],
    inputSchema: s.object(
      {
        name: s.string({ minLength: 1, description: "Workload name." }),
        namespace: s.string("Namespace the workload runs in."),
      },
      { required: ["name"], description: "Target workload." },
    ),
    outputSchema: costOutput,
  }),
  defineProviderAction(service, {
    name: "delete_workload",
    description: "Delete a DelegateCluster workload. Idempotent when the workload is absent.",
    requiredScopes: [],
    inputSchema: s.object(
      {
        name: s.string({ minLength: 1, description: "Workload name." }),
        namespace: s.string("Namespace the workload runs in."),
      },
      { required: ["name"], description: "Target workload." },
    ),
    outputSchema: deleteOutput,
  }),
];

export type DelegateClusterActionName =
  | "list_workloads"
  | "create_workload"
  | "get_workload_status"
  | "get_workload_logs"
  | "get_workload_cost"
  | "delete_workload";
