import OpenAI from "openai";
import dotenv from "dotenv";
import { getWeather } from "./weatherService.js";
import { getBalance, sendTransaction } from "./web3Service.js";
import ethWeatherAssistantPrompt from "./instruction.js";
import tools from "../utils/tools.js";
import { webSearch } from "./websearchService.js";
import { getGPS } from "./getService.js";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function extractFinalMessage(response) {
  let finalMessage = "";
  if (!response?.output) return "";

  response.output.forEach((item) => {
    if (item.type === "message" && item.content) {
      item.content.forEach((c) => {
        if (c.type === "output_text") {
          finalMessage += c.text;
        }
      });
    }
  });
  return finalMessage || "";
}

export async function handleFunctionCall(message) {
  try {
    // Keep a running list of conversation input
    let input = [
      {
        role: "user",
        content: [{ type: "input_text", text: String(message) }],
      },
    ];

    console.log("initial input >>> ", JSON.stringify(input, null, 2));

    // Step 1: ask model with tools
    let response = await openai.responses.create({
      model: "gpt-4.1-mini",
      tools,
      input,
    });

    console.log("first Response >>> ", JSON.stringify(response, null, 2));

    // Step 2: check if function call requested
    for (const item of response.output) {
      if (item.type === "function_call") {
        const { name, arguments: rawArgs, call_id } = item;
        let args = {};
        try {
          args = JSON.parse(rawArgs);
        } catch (err) {
          console.error("Bad JSON in function args:", err);
        }

        // Step 3: execute actual function
        let result;

        if (name === "get_weather") {
          result = { weather: await getWeather(args.location) };
        } else if (name === "send_transaction") {
          try {
            const tx = await sendTransaction(args.to, args.amount);
            result = tx?.hash
              ? { txHash: tx.hash, status: "confirmed", receipt: tx.receipt }
              : {
                  txHash: null,
                  status: "failed",
                  error: tx?.error || "Unknown",
                };
          } catch (err) {
            result = { txHash: null, status: "failed", error: err.message };
          }
        } else if (name === "get_balance") {
          result = await getBalance(args.address);
        } else if (name === "web_search") {
          result = { search: await webSearch(args.query) };
        } else if (name === "get_gps") {
          result = await getGPS();
        }

        console.log("Function Result >>>", result);
        input.push(item);
        input.push({
          type: "function_call_output",
          call_id,
          output: JSON.stringify(result),
        });

        console.log(
          "Updated Input with Tool Result >>>",
          JSON.stringify(input, null, 2)
        );

        // Step 5: re-run model to get natural reply
        response = await openai.responses.create({
          model: "gpt-4.1-mini",
          tools,
          input,
          instructions: ethWeatherAssistantPrompt,
        });

        console.log("Second Response >>>", JSON.stringify(response, null, 2));
      }
    }

    // Step 6: return final message
    return extractFinalMessage(response) || "No output.";
  } catch (err) {
    console.error("handleFunctionCall error:", err);
    return "Error handling function call.";
  }
}

export async function chatWithAI(message) {
  try {
    if (/summary/i.test(message)) {
      let response = await openai.responses.create({
        model: "gpt-4.1-mini",
        input: [
          { role: "user", content: [{ type: "input_text", text: message }] },
        ],
      });
      return extractFinalMessage(response) || "No output.";
    }

    let response = await openai.responses.create({
      model: "gpt-4.1-mini",
      tools,
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: String(message) }],
        },
      ],
    });

    console.log("Initial Chat Response >>>", JSON.stringify(response, null, 2));

    let finalMessage = extractFinalMessage(response);

    // Pattern matching → route into tool handler
    if (/weather in (.+)/i.test(message)) {
      const location = message.match(/weather in (.+)/i)[1];
      console.log("Weather Route Triggered >>>", location);
      finalMessage = await handleFunctionCall(`Weather in ${location}`);
    }

    if (
      /(send|transfer|pay|move|give)\s+(\d+(\.\d+)?)\s*(eth|ether)\s+to\s+(0x[a-fA-F0-9]{40})/i.test(
        message
      )
    ) {
      const [, , amount, , , to] = message.match(
        /(send|transfer|pay|move|give)\s+(\d+(\.\d+)?)\s*(eth|ether)\s+to\s+(0x[a-fA-F0-9]{40})/i
      );
      console.log("Transaction Route Triggered >>>", { to, amount });
      finalMessage = await handleFunctionCall(`send ${amount} ETH to ${to}`);
    }

    if (/where am i/i.test(message)) {
      console.log("GPS Route Triggered >>>");
      finalMessage = await handleFunctionCall("get my current GPS location");
    }

    return finalMessage || "I couldn't generate a response.";
  } catch (err) {
    console.error("chatWithAI error:", err);
    return "Error communicating with AI.";
  }
}
