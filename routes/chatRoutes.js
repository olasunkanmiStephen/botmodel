import express from "express";
import { chatWithAI } from "../services/openaiService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { message } = req.body;
  try {
    const reply = await chatWithAI(message);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
