import mongoose from "mongoose";


const connect = async () => {
  try {
    console.log("Attempting to connect to database.....");
    await mongoose.connect(process.env.MONGO_URI, {});
    console.log("Connected to database.....");
  } catch (error) {
    console.log("Failed to connect to database.....", error.message);
    process.exit(1);
  }
};

export default connect;

export const tools = [
  {
    type: "function",
    name: "get_weather",
    description: "Get the current weather in a given location.",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA",
        },
      },
      required: ["location"],
    },
  },
  {
    type: "function",
    name: "send_transaction",
    description: "Send an Ethereum transaction",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "The recipient Ethereum address",
        },
        amount: {
          type: "string",
          description: "The amount of Eth to send (as a string, e.g '0.01')",
        },
      },
      required: ["to", "amount"],
    },
  },
];
