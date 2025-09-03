import mongoose from "mongoose";
import { type } from "os";


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


const tools = [
  {
    type: "function",
    name: "get_weather",
    description: "Get the current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "City or place" },
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
          description: "Recipient Ethereum address (0x...)",
        },
        amount: {
          type: "number",
          description: "Amount of ETH to send",
        },
      },
      required: ["to", "amount"],
    },
  },
  {
    type:"function",
    name: "web_search",
    description: "Perform a web search and retrn relevant results",
    input_Schema: {
      type: "object",
      properties: {
        query: {
          type: "String",
          description: "Search query to look to look up on the web"
        },
        required: ["query"],
      }
    }
  }
];
export default { tools, connect };