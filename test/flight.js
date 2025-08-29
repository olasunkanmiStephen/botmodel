import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import OpenAI from "openai";
import { type } from "os";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// calling flight function
async function getFlightStatus(flightNumber) {
  try {
    const response = await axios.get(
      `http://api.aviationstack.com/v1/flights?access_key=${process.env.FLIGHT_API_KEY}&flight_iata=${flightNumber}`
    );
    console.log("Fliht raw response:", response.data)

    if (response.data.data.length === 0) return "Flight not found.";
    const flight = response.data.data[0];

    return {
      flight_number: flight.flight.iata,
      airline: flight.airline.name,
      departure_airport: flight.departure.airport,
      departure_time: flight.departure.estimated,
      arrival_airport: flight.arrival.airport,
      arrival_time: flight.arrival.estimated,
      status: flight.flight_status,
    };
  } catch (error) {
    console.log("flight api error", error.message)
    return { error: "Unable to fetch flight data." };
  }
}

// function openai
const functions = [
  {
    name: "get_flight_status",
    description: "Get real-time flight status for a given flight number",
    parameters: {
      type: "object",
      properties: {
        flight_number: {
          type: "string",
          description: "The IATA flight number",
        },
      },
      required: ["flight_number"],
    },
  },
];

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const firstResponse = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
      functions,
      function_call: "auto",
    });

    const responseMessage = firstResponse.choices[0].message;

    if (responseMessage.function_call) {
      const flightNumber = JSON.parse(
        responseMessage.function_call.arguments
      ).flight_number;
      const flightData = await getFlightStatus(flightNumber);
      return res.json({ type: "flight_info", data: flightData });
    }

    res.json({ type: "text", data: responseMessage.content });
  } catch (error) {
     res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
