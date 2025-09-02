import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
