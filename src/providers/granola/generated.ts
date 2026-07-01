import type { JsonSchema } from "../../core/types.ts";

export interface GranolaGeneratedActionSchema {
  name: string;
  description: string;
  requiredScopes: string[];
  providerPermissions: string[];
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
}

export const granolaGeneratedActionSchemas: GranolaGeneratedActionSchema[] = [
  {
    name: "list_notes",
    description: "List accessible Granola meeting notes with optional date, folder, and cursor filters.",
    requiredScopes: [],
    providerPermissions: [],
    inputSchema: {
      type: "object",
      properties: {
        created_before: {
          type: "string",
          minLength: 1,
          description: "Date or date-time filter accepted by Granola, such as 2026-01-27 or 2026-01-27T15:30:00Z.",
        },
        created_after: {
          type: "string",
          minLength: 1,
          description: "Date or date-time filter accepted by Granola, such as 2026-01-27 or 2026-01-27T15:30:00Z.",
        },
        updated_after: {
          type: "string",
          minLength: 1,
          description: "Date or date-time filter accepted by Granola, such as 2026-01-27 or 2026-01-27T15:30:00Z.",
        },
        folder_id: {
          type: "string",
          minLength: 1,
          description: "Granola folder ID used to filter notes.",
        },
        cursor: {
          type: "string",
          minLength: 1,
          description: "Cursor token returned by a previous Granola page.",
        },
        page_size: {
          type: "integer",
          minimum: 1,
          maximum: 30,
          description: "Maximum number of records to return. Granola allows 1 to 30.",
        },
      },
      additionalProperties: false,
      description: "Query parameters for listing Granola notes.",
    },
    outputSchema: {
      type: "object",
      properties: {
        notes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "The ID of the note.",
              },
              object: {
                type: "string",
                description: "The object type returned by Granola.",
              },
              title: {
                type: ["string", "null"],
                description: "The title of the note.",
              },
              owner: {
                type: "object",
                properties: {
                  name: {
                    type: ["string", "null"],
                    description: "The name of the user.",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    description: "The email address of the user.",
                  },
                },
                additionalProperties: true,
                description: "A Granola user object.",
              },
              created_at: {
                type: "string",
                description: "The creation time of the note.",
              },
              updated_at: {
                type: "string",
                description: "The last update time of the note.",
              },
            },
            additionalProperties: true,
            description: "A Granola note summary object.",
          },
          description: "Notes returned by Granola.",
        },
        hasMore: {
          type: "boolean",
          description: "Whether Granola has more notes to fetch.",
        },
        cursor: {
          type: ["string", "null"],
          description: "The cursor to continue from, when one is available.",
        },
        nextCursor: {
          type: ["string", "null"],
          description: "Cursor to pass into the next request, when one is available.",
        },
      },
      required: ["notes", "hasMore", "cursor", "nextCursor"],
      additionalProperties: false,
      description: "Paginated Granola notes response.",
    },
  },
  {
    name: "get_note",
    description: "Get a Granola meeting note by ID, optionally including the transcript.",
    requiredScopes: [],
    providerPermissions: [],
    inputSchema: {
      type: "object",
      properties: {
        note_id: {
          type: "string",
          minLength: 1,
          description: "Granola note ID to retrieve.",
        },
        include: {
          type: "string",
          enum: ["transcript"],
          description: "Optional related Granola note data to include.",
        },
      },
      required: ["note_id"],
      additionalProperties: false,
      description: "Path and query parameters for retrieving a Granola note.",
    },
    outputSchema: {
      type: "object",
      properties: {
        note: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "The ID of the note.",
            },
            object: {
              type: "string",
              description: "The object type returned by Granola.",
            },
            title: {
              type: ["string", "null"],
              description: "The title of the note.",
            },
            owner: {
              type: "object",
              properties: {
                name: {
                  type: ["string", "null"],
                  description: "The name of the user.",
                },
                email: {
                  type: "string",
                  format: "email",
                  description: "The email address of the user.",
                },
              },
              additionalProperties: true,
              description: "A Granola user object.",
            },
            created_at: {
              type: "string",
              description: "The creation time of the note.",
            },
            updated_at: {
              type: "string",
              description: "The last update time of the note.",
            },
            web_url: {
              type: "string",
              format: "uri",
              description: "The URL to view the note in Granola.",
            },
            calendar_event: {
              type: ["object", "null"],
              properties: {
                event_title: {
                  type: ["string", "null"],
                  description: "The title of the calendar event.",
                },
                invitees: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      email: {
                        type: "string",
                        format: "email",
                        description: "The email address of the calendar invitee.",
                      },
                    },
                    additionalProperties: true,
                    description: "A Granola calendar invitee object.",
                  },
                  description: "Calendar invitees returned by Granola.",
                },
                organiser: {
                  type: ["string", "null"],
                  description: "The email address of the organiser.",
                },
                calendar_event_id: {
                  type: ["string", "null"],
                  description: "The ID of the calendar event.",
                },
                scheduled_start_time: {
                  type: ["string", "null"],
                  description: "The scheduled start time of the calendar event.",
                },
                scheduled_end_time: {
                  type: ["string", "null"],
                  description: "The scheduled end time of the calendar event.",
                },
              },
              additionalProperties: true,
              description: "A Granola calendar event object.",
            },
            attendees: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: {
                    type: ["string", "null"],
                    description: "The name of the user.",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    description: "The email address of the user.",
                  },
                },
                additionalProperties: true,
                description: "A Granola user object.",
              },
              description: "Meeting attendees returned by Granola.",
            },
            folder_membership: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "The ID of the folder.",
                  },
                  object: {
                    type: "string",
                    description: "The object type returned by Granola.",
                  },
                  name: {
                    type: "string",
                    description: "The name of the folder.",
                  },
                  parent_folder_id: {
                    type: ["string", "null"],
                    description: "The ID of the parent folder, or null for top-level folders.",
                  },
                },
                additionalProperties: true,
                description: "A Granola folder object.",
              },
              description: "Folders that contain the note.",
            },
            summary_text: {
              type: "string",
              description: "The plain text summary of the note.",
            },
            summary_markdown: {
              type: ["string", "null"],
              description: "The markdown summary of the note, when available.",
            },
            transcript: {
              type: ["array", "null"],
              items: {
                type: "object",
                properties: {
                  speaker: {
                    type: "object",
                    properties: {
                      source: {
                        type: "string",
                        description: "The source of the speaker, such as microphone or speaker.",
                      },
                      diarization_label: {
                        type: "string",
                        description: "The diarized anonymous speaker label when Granola returns one.",
                      },
                    },
                    additionalProperties: true,
                    description: "A Granola transcript speaker object.",
                  },
                  text: {
                    type: "string",
                    description: "The transcript text.",
                  },
                  start_time: {
                    type: "string",
                    description: "The start time of the transcript item.",
                  },
                  end_time: {
                    type: "string",
                    description: "The end time of the transcript item.",
                  },
                },
                additionalProperties: true,
                description: "A Granola transcript item.",
              },
              description: "Transcript items returned by Granola.",
            },
          },
          additionalProperties: true,
          description: "A Granola note object.",
        },
      },
      required: ["note"],
      additionalProperties: false,
      description: "Granola note response.",
    },
  },
  {
    name: "list_folders",
    description: "List accessible Granola folders with cursor pagination.",
    requiredScopes: [],
    providerPermissions: [],
    inputSchema: {
      type: "object",
      properties: {
        cursor: {
          type: "string",
          minLength: 1,
          description: "Cursor token returned by a previous Granola page.",
        },
        page_size: {
          type: "integer",
          minimum: 1,
          maximum: 30,
          description: "Maximum number of records to return. Granola allows 1 to 30.",
        },
      },
      additionalProperties: false,
      description: "Query parameters for listing Granola folders.",
    },
    outputSchema: {
      type: "object",
      properties: {
        folders: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "The ID of the folder.",
              },
              object: {
                type: "string",
                description: "The object type returned by Granola.",
              },
              name: {
                type: "string",
                description: "The name of the folder.",
              },
              parent_folder_id: {
                type: ["string", "null"],
                description: "The ID of the parent folder, or null for top-level folders.",
              },
            },
            additionalProperties: true,
            description: "A Granola folder object.",
          },
          description: "Folders returned by Granola.",
        },
        hasMore: {
          type: "boolean",
          description: "Whether Granola has more folders to fetch.",
        },
        cursor: {
          type: ["string", "null"],
          description: "The cursor to continue from, when one is available.",
        },
        nextCursor: {
          type: ["string", "null"],
          description: "Cursor to pass into the next request, when one is available.",
        },
      },
      required: ["folders", "hasMore", "cursor", "nextCursor"],
      additionalProperties: false,
      description: "Paginated Granola folders response.",
    },
  },
];
