import express from "express";
import { chatWithAI } from "../services/openaiService.js";
import authMiddleware from "../middleware/authMiddleware.js";
import Message from "../model/messageModel.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const { message } = req.body;
  try {
    await Message.create({
      userId: req.user.userId,
      role: "user",
      message,
    });

    const userMessages = await Message.find({ userId: req.user.userId }).sort({createdAt: 1})

    const messageTexts = userMessages.map(msg => msg.message).join("\n");

    const reply = await chatWithAI(messageTexts);


    const botMessage = await Message.create({
      userId: req.user.userId,
      role: "assistant",
      message: reply,
    });
    

    res.json({ reply: botMessage.message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const history = await Message.find({ userId }).sort({
      createdAt: 1,
    });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await Message.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, role: "user" }, // only user messages editable
      { content: req.body.content },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Message not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;


