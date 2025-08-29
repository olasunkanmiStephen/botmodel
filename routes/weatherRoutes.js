import express from "express";
import { handleFunctionCall } from "../services/openaiService.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const location = req.query.location;
  if (!location) {
    return res.status(400).json({ error: "Location is required" });
  }

  
  try {
    const aiWeather = await handleFunctionCall(location);
    res.json({ aiWeather });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
