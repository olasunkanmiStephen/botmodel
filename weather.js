import OpenAI from "openai";
import fetch from "node-fetch";
import dotenv from "dotenv";
import express from "express";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import cors from "cors";

dotenv.config();
const app = express();

app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Tool definition to the model
const tools = [
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

// Simple helper to call weatherapi.com directly
async function getWeather(loc) {
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(
    loc
  )}&aqi=no`;

  const r = await fetch(url);
  const data = await r.json();

  if (data.error) return `Weather data not found for ${loc}`;
  return `${data.location.name}: ${data.current.temp_c}°C, ${data.current.condition.text}`;
}

app.use(express.json());

async function handleWeather(message) {
  try {
    let input = [
      { role: "user", 
        content: message },
    ];

    // Ask model with tool
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

    // Run tool to get weather result
    const weatherStr = await getWeather(functionCallArguments.location);
    const result = { weather: weatherStr };

    // Provides tool result
    input.push({
      type: "function_call_output",
      call_id: functionCall.call_id,
      output: JSON.stringify(result),
    });

    // Asking OpenAI for final response
    response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions: `You are a helpful assistant that provides weather updates. Use the information provided by the tool to answer the user's question. Follow these guidelines:

1. Only use the weather information retrieved by the tool. Do not guess or make up weather data.
2. Include the current temperature, weather condition, and city name exactly as provided by the tool.
3. If previous weather information is available, summarize or compare it briefly, highlighting any changes (e.g., warmer, colder, or different conditions).
4. Write in a friendly, natural tone, as if you are explaining the weather to a user.
5. Keep your response concise but informative, adding a small additional comment or tip about the weather if appropriate (e.g., "It might be sunny later, so take sunglasses!").
6. Avoid including any unrelated information or repeating irrelevant details.
`,
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

    // Fallback if model didn’t respond cleanly
    if (!finalMessage) finalMessage = result.weather;

    return finalMessage;
  } catch (err) {
    console.error(err);
    return "Error fetching weather data.";
  }
}

// 🔹 Chat route
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  try {
    // First normal AI response
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

    /**
     * 🔹 Check if user asked about weather
     * If yes, call our weather function instead of generic AI
     */
    if (/weather in (.+)/i.test(message)) {
      const location = message.match(/weather in (.+)/i)[1];
      finalMessage = await handleWeather(location);
    }

    res.json({ reply: finalMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 🔹 Weather route (kept intact as you wrote it)
 * Now it just reuses the `handleWeather` function above.
 */
app.get("/weather", async (req, res) => {
  const location = req.query.location;
  if (!location) {
    return res.status(400).json({ error: "Location is required" });
  }

  try {
    const aiWeather = await handleWeather(location);
    res.json({ aiWeather });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5500, () => console.log(`Server running at http://localhost:5500`));
