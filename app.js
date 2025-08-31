import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import chatRoutes from "./routes/chatRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import authRoutes from "./routes/authRoutes.js"


const app = express();
app.set("strict routing", false);
app.use(cors());
app.use(express.json());

// static public folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// routes
app.use("/auth", authRoutes)
app.use("/chat", chatRoutes);
app.use("/weather", weatherRoutes);

export default app;
