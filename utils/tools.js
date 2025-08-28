export const tools = [
  {
    type: "function",
    name: "get_weather",
    description: "Get current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City or location name (e.g., London, Paris, New York)",
        },
      },
      required: ["location"],
    },
  },
];
