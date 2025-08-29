import OpenAI from "openai";
import { tools } from "../utils/tools.js";
import { getWeather } from "./weatherService.js";
import dotenv from "dotenv";
import { sendTransaction } from "./web3Service.js";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handleFunctionCall(message) {
  try {
    let input = [{ role: "user", content: message }];

    // Ask AI with tools
    let response = await openai.responses.create({
      model: "gpt-4.1-mini",
      tools,
      input,
    });

    let functionCall = null;
    let functionCallArguments = null;
    input = input.concat(response.output);

    response.output.forEach((item) => {
      if (item.type === "function_call") {
        functionCall = item;
        functionCallArguments = JSON.parse(item.arguments);
      }
    });

    let result;
    if (functionCall) {
      if (functionCall.name === "get_weather") {
        result = { weather: await getWeather(functionCallArguments.location) };
      }

      if (functionCall.name === "send_transaction") {
        try {
          const tx = await sendTransaction(
            functionCallArguments.to,
            functionCallArguments.amount
          );
          if (tx?.error) {
            result = {
              txHash: null,
              status: "failed",
              error: tx.error,
            };
          } else if (tx?.hash) {
            result = {
              txHash: tx.hash,
              status: "confirmed",
              receipt: tx.receipt,
            };
          } else {
            result = {
              txHash: null,
              status: "unknown",
              error: "Unexpected transaction result.",
            };
          }
        } catch (error) {
          result = { txHash: null, status: "failed", error: error.message };
        }
      }
      input.push({
        type: "function_call_output",
        call_id: functionCall.call_id,
        output: JSON.stringify(result),
      });

      // AI final response
      response = await openai.responses.create({
        model: "gpt-4.1-mini",
        instructions: `
          You are a helpful assistant that provides weather updates and Ethereum (ETH) transaction details. Use the information provided by the tools to answer the user's question. Follow these guidelines:

          **Weather Updates:**
          1. Only use the weather information retrieved by the tool. Do not guess or make up weather data.
          2. Include the current temperature, weather condition, and city name exactly as provided by the tool.
          3. If previous weather information is available, summarize or compare it briefly, highlighting any changes (e.g., warmer, colder, or different conditions).
          4. Write in a friendly, natural tone, as if you are explaining the weather to a user.
          5. Keep your response concise but informative, adding a small additional comment or tip about the weather if appropriate (e.g., "It might be sunny later, so take sunglasses!").
          6. Avoid including any unrelated information or repeating irrelevant details.

          **Ethereum Transaction Updates:**
          1. Only use Ethereum transaction details retrieved by the tool (e.g., transaction hash, status, gas fee, block confirmation). Do not invent or assume details.  
          2. Clearly state the transaction status (e.g., pending, confirmed, failed) and provide the transaction hash.  
          3. If available, include the amount of ETH sent, the receiving address, and the gas fee used.  
          4. If previous transaction information is available, summarize or compare it (e.g., “This transaction used a higher gas fee than your last one, so it confirmed faster”).  
          5. Keep the explanation simple and user-friendly, avoiding technical jargon unless requested.  
          6. Provide a quick tip if useful (e.g., “Gas fees are lower right now, so it’s a good time to transact”).  

          **General:**
          - Always keep responses concise, clear, and helpful.   
        `,
        tools,
        input,
      });
    }

    let finalMessage = "";
    response.output.forEach((item) => {
      if (item.type === "message") {
        item.content.forEach((c) => {
          if (c.type === "output_text") {
            finalMessage += c.text;
          }
        });
      }
    });

    if (!finalMessage && result) {
      finalMessage = JSON.stringify(result);
    }

    return finalMessage;
  } catch (err) {
    console.error(err);
    return "Error fetching weather data.";
  }
}

export async function chatWithAI(message) {
  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [{ role: "user", content: message }],
    });

    let finalMessage = "";
    response.output.forEach((item) => {
      if (item.type === "message") {
        item.content.forEach((c) => {
          if (c.type === "output_text") {
            finalMessage += c.text;
          }
        });
      }
    });

    // Special case: "weather in ..."
    if (/weather in (.+)/i.test(message)) {
      const location = message.match(/weather in (.+)/i)[1];
      finalMessage = await handleFunctionCall(location);
    }

    if (/send (\d+(\.\d+)?) eth to (0x[a-fA-F0-9]{40})/i.test(message)) {
      const [, amount, , to] = message.match(
        /send (\d+(\.\d+)?) eth to (0x[a-fA-F0-9]{40})/i
      );
      finalMessage = await handleFunctionCall(JSON.stringify({ to, amount }));
    }

    return finalMessage;
  } catch (err) {
    console.error(err);
    return "Error communicating with AI.";
  }
}
