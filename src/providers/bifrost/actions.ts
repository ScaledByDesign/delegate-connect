import type { ActionDefinition } from "../../core/types.ts";

import { s } from "../../core/json-schema.ts";
import { defineProviderAction } from "../../core/provider-definition.ts";

const service = "bifrost";

const modelSchema = s.looseObject(
  {
    id: s.string("Model identifier."),
    name: s.string("Human-readable model name."),
    context_length: s.integer("Maximum context length supported by the model."),
    pricing: s.looseObject("Pricing metadata for the model."),
  },
  { description: "An OpenAI-compatible model record." },
);

const modelsOutput = s.looseObject(
  {
    data: s.array("Models available through the gateway.", modelSchema),
  },
  { description: "An OpenAI-compatible list of models." },
);

const messageSchema = s.looseObject(
  {
    role: s.string("Role of the message author, such as system, user, or assistant."),
    content: s.unknown("Message content. Usually a string, or a structured content array."),
  },
  { description: "A chat message." },
);

const chatCompletionsInput = s.object(
  "The input payload for this action. Additional OpenAI-compatible parameters are forwarded to the gateway.",
  {
    model: s.nonEmptyString("Model id to use for the completion."),
    messages: s.array("Conversation messages sent to the model.", messageSchema, { minItems: 1 }),
    temperature: s.number("Sampling temperature."),
    max_tokens: s.integer("Maximum number of tokens to generate."),
    stream: s.boolean("Whether to stream the response."),
  },
  { required: ["model", "messages"], additionalProperties: true },
);

const chatCompletionsOutput = s.looseObject(
  {
    choices: s.array("Generated completion choices.", s.looseObject("A completion choice.")),
  },
  { description: "An OpenAI-compatible chat completion response." },
);

export const bifrostActions: ActionDefinition[] = [
  defineProviderAction(service, {
    name: "list_models",
    description: "List the models available through the Bifrost gateway (OpenAI-compatible).",
    requiredScopes: [],
    inputSchema: s.object("The input payload for this action.", {}),
    outputSchema: modelsOutput,
    followUpActions: ["bifrost.chat_completions"],
  }),
  defineProviderAction(service, {
    name: "chat_completions",
    description: "Create a chat completion through the Bifrost gateway (OpenAI-compatible).",
    requiredScopes: [],
    inputSchema: chatCompletionsInput,
    outputSchema: chatCompletionsOutput,
  }),
];

export type BifrostActionName = "list_models" | "chat_completions";
