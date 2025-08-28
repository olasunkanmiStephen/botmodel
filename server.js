import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
