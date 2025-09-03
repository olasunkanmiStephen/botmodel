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
    "https://chatassistant-5m3c.vercel.app",
    "http://localhost:5174",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.options("*", cors());

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
