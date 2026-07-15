import type { ActionDefinition, JsonSchema } from "../../core/types.ts";

import { s } from "../../core/json-schema.ts";
import { defineProviderAction } from "../../core/provider-definition.ts";

const service = "stickyio";

const rawEnvelope = s.looseObject({}, { description: "The raw response envelope returned by the Sticky.io API." });
const rawRecord = s.looseObject({}, { description: "A raw record returned by the Sticky.io API." });

function recordArray(description: string): JsonSchema {
  return s.array(rawRecord, { description });
}

const startDate = s.string({
  description: "Start of the date range filter. Accepts ISO yyyy-mm-dd or m/d/yyyy; normalized to Sticky.io's required m/d/yyyy format.",
});
const endDate = s.string({
  description: "End of the date range filter. Accepts ISO yyyy-mm-dd or m/d/yyyy; normalized to Sticky.io's required m/d/yyyy format.",
});
const campaignId = s.nonEmptyString("A Sticky.io campaign id, or \"all\" to search across every campaign.");
const searchType = s.nonEmptyString("The Sticky.io search_type used to interpret search_value.");
const searchValue = s.nonEmptyString("The value matched against the selected search_type.");
const pageNum = s.integer({ minimum: 1, description: "The 1-based page number of results to return." });
const perPage = s.integer({ minimum: 1, maximum: 500, description: "The number of records to return per page." });

const findInput = s.actionInput(
  {
    startDate,
    endDate,
    campaignId,
    searchType,
    searchValue,
    pageNum,
    perPage,
  },
  [],
  "Optional Sticky.io find filters. All fields are optional; omit them to return the default result set.",
);

export type StickyioActionName =
  | "list_orders"
  | "get_order"
  | "list_customers"
  | "get_customer"
  | "list_products"
  | "list_campaigns"
  | "get_campaign"
  | "list_offers"
  | "list_shipping_methods"
  | "list_prospects"
  | "get_prospect"
  | "refund_order"
  | "void_order";

export const stickyioActions: ActionDefinition[] = [
  action(
    "list_orders",
    "Search Sticky.io orders across campaigns with optional date-range and search filters.",
    findInput,
    s.actionOutput(
      {
        orders: recordArray("Orders returned by Sticky.io order_find."),
        raw: rawEnvelope,
      },
      "The normalized Sticky.io order search response.",
    ),
  ),
  action(
    "get_order",
    "Retrieve one or more Sticky.io orders by order id.",
    s.actionInput(
      { orderIds: s.stringArray("The Sticky.io order ids to view.", { itemDescription: "A Sticky.io order id." }) },
      ["orderIds"],
      "The Sticky.io order lookup input.",
    ),
    s.actionOutput(
      {
        orders: recordArray("Orders returned by Sticky.io order_view."),
        raw: rawEnvelope,
      },
      "The normalized Sticky.io order detail response.",
    ),
  ),
  action(
    "list_customers",
    "Search Sticky.io customers across campaigns with optional date-range and search filters.",
    findInput,
    s.actionOutput(
      {
        customers: recordArray("Customers returned by Sticky.io customer_find."),
        raw: rawEnvelope,
      },
      "The normalized Sticky.io customer search response.",
    ),
  ),
  action(
    "get_customer",
    "Retrieve one Sticky.io customer by customer id.",
    s.actionInput(
      { customerId: s.nonEmptyString("The Sticky.io customer id to view.") },
      ["customerId"],
      "The Sticky.io customer lookup input.",
    ),
    s.actionOutput({ customer: s.nullable(rawRecord), raw: rawEnvelope }, "The normalized Sticky.io customer response."),
  ),
  action(
    "list_products",
    "List Sticky.io products. Omit productIds to return every product.",
    s.actionInput(
      {
        productIds: s.stringArray("Specific Sticky.io product ids to return.", {
          itemDescription: "A Sticky.io product id.",
        }),
      },
      [],
      "The Sticky.io product list input.",
    ),
    s.actionOutput(
      {
        products: recordArray("Products returned by Sticky.io product_index."),
        raw: rawEnvelope,
      },
      "The normalized Sticky.io product list response.",
    ),
  ),
  action(
    "list_campaigns",
    "List active Sticky.io campaigns.",
    s.actionInput({}, [], "No input is required to list active Sticky.io campaigns."),
    s.actionOutput(
      {
        campaigns: recordArray("Campaigns returned by Sticky.io campaign_find_active."),
        raw: rawEnvelope,
      },
      "The normalized Sticky.io campaign list response.",
    ),
  ),
  action(
    "get_campaign",
    "Retrieve one Sticky.io campaign by campaign id.",
    s.actionInput(
      { campaignId: s.nonEmptyString("The Sticky.io campaign id to view.") },
      ["campaignId"],
      "The Sticky.io campaign lookup input.",
    ),
    s.actionOutput({ campaign: s.nullable(rawRecord), raw: rawEnvelope }, "The normalized Sticky.io campaign response."),
  ),
  action(
    "list_offers",
    "View Sticky.io offers by offer id or campaign id.",
    s.actionInput(
      {
        offerId: s.nonEmptyString("A specific Sticky.io offer id to view."),
        campaignId: s.nonEmptyString("A Sticky.io campaign id whose offers should be returned."),
      },
      [],
      "The Sticky.io offer lookup input. Provide offerId, campaignId, or both.",
    ),
    s.actionOutput(
      {
        offers: recordArray("Offers returned by Sticky.io offer_view."),
        raw: rawEnvelope,
      },
      "The normalized Sticky.io offer response.",
    ),
  ),
  action(
    "list_shipping_methods",
    "Find Sticky.io shipping methods, optionally scoped to a campaign.",
    s.actionInput(
      { campaignId: s.nonEmptyString("A Sticky.io campaign id, or \"all\" for every campaign.") },
      [],
      "The Sticky.io shipping method search input.",
    ),
    s.actionOutput(
      {
        shippingMethods: recordArray("Shipping methods returned by Sticky.io shipping_method_find."),
        raw: rawEnvelope,
      },
      "The normalized Sticky.io shipping method response.",
    ),
  ),
  action(
    "list_prospects",
    "Search Sticky.io prospects with optional campaign and date-range filters.",
    s.actionInput(
      {
        campaignId: s.nonEmptyString("A Sticky.io campaign id, or \"all\" for every campaign."),
        startDate,
        endDate,
      },
      [],
      "The Sticky.io prospect search input.",
    ),
    s.actionOutput(
      {
        prospects: recordArray("Prospects returned by Sticky.io prospect_find."),
        raw: rawEnvelope,
      },
      "The normalized Sticky.io prospect search response.",
    ),
  ),
  action(
    "get_prospect",
    "Retrieve one Sticky.io prospect by prospect id.",
    s.actionInput(
      { prospectId: s.nonEmptyString("The Sticky.io prospect id to view.") },
      ["prospectId"],
      "The Sticky.io prospect lookup input.",
    ),
    s.actionOutput({ prospect: s.nullable(rawRecord), raw: rawEnvelope }, "The normalized Sticky.io prospect response."),
  ),
  action(
    "refund_order",
    "Refund a Sticky.io order by amount, optionally keeping the recurring subscription active.",
    s.actionInput(
      {
        orderId: s.nonEmptyString("The Sticky.io order id to refund."),
        amount: s.nonEmptyString("The refund amount as a decimal string, such as \"19.99\"."),
        keepRecurring: s.boolean({ description: "Whether to keep the recurring subscription active after refunding." }),
      },
      ["orderId", "amount"],
      "The Sticky.io order refund input.",
    ),
    s.actionOutput({ raw: rawEnvelope }, "The raw Sticky.io order_refund response."),
  ),
  action(
    "void_order",
    "Void a Sticky.io order by order id.",
    s.actionInput(
      { orderId: s.nonEmptyString("The Sticky.io order id to void.") },
      ["orderId"],
      "The Sticky.io order void input.",
    ),
    s.actionOutput({ raw: rawEnvelope }, "The raw Sticky.io order_void response."),
  ),
];

function action(
  name: StickyioActionName,
  description: string,
  inputSchema: JsonSchema,
  outputSchema: JsonSchema,
): ActionDefinition {
  return defineProviderAction(service, {
    name,
    description,
    requiredScopes: [],
    inputSchema,
    outputSchema,
  });
}
