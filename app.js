import express from "express";
import cors from "cors";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import chatRoutes from "./routes/chatRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.set("strict routing", false);

const allowedOrigins = [
  "https://chatassistant-ten.vercel.app",
  "https://www.chatassistant-ten.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.includes("localhost")
      ) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS >>>", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// static public folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// routes
app.use("/auth", authRoutes);
app.use("/chat", chatRoutes);
app.use("/weather", weatherRoutes);

export default app;
