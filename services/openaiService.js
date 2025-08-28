import OpenAI from "openai";
import { tools } from "../utils/tools.js";
import { getWeather } from "./weatherService.js";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handleWeather(message) {
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

    // Call actual weather API
    const weatherStr = await getWeather(functionCallArguments.location);
    const result = { weather: weatherStr };

    input.push({
      type: "function_call_output",
      call_id: functionCall.call_id,
      output: JSON.stringify(result),
    });

    // AI final response
    response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions: `You are a helpful assistant that provides weather updates...`,
      tools,
      input,
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

    if (!finalMessage) finalMessage = result.weather;
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
      finalMessage = await handleWeather(location);
    }

    return finalMessage;
  } catch (err) {
    console.error(err);
    return "Error communicating with AI.";
  }
}
