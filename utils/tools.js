import mongoose from "mongoose";


export const connect = async () => {
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
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to look to look up on the web"
        },
        required: ["query"],
      }
    }
  },
  {
    type: "function",
    name: "get_balance",
    description: "Get the ETH balance of an Ethereum address",
    parameters: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Ethereum address (0x...)"
        },
      },
      required: ["address"]
    }
  }
];

export default tools;