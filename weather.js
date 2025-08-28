import OpenAI from "openai";
import fetch from "node-fetch";
import dotenv from "dotenv";
import express from "express";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import cors from "cors"

dotenv.config();
const app = express();

app.use(cors())

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

async function getWeather(loc) {
  const apiKey = process.env.WEATHER_API_KEY; // ✅ match .env
  const url = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(
    loc
  )}&aqi=no`;

  const r = await fetch(url);
  const data = await r.json();

  if (data.error) return `Weather data not found for ${loc}`;
  return `${data.location.name}: ${data.current.temp_c}°C, ${data.current.condition.text}`;
}

app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message } = req.body;
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

    res.json({ reply: finalMessage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.get("/weather", async (req, res) => {
  const location = req.query.location;
  if (!location) {
    return res.status(400).json({ error: "Location is required" });
  }

  
  try {
    let input = [
      { role: "user", content: `What's the weather in ${location}?` },
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
      instructions:
        "Respond only with the weather retrieved by the tool, and also talk a bit more about the previous weather.",
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
    res.json({
      aiWeather: finalMessage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5500, () => console.log(`Server running at http://localhost:5500`));
