import dotenv from "dotenv";
import app from "./app.js";
import { connect } from "./utils/tools.js"

dotenv.config();

const port = process.env.PORT;

const server = async () => {
    try {
        await connect();

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);

        });

    } catch (error) {
        console.log("Failed to start server...", error.message);
        process.exit(1);
    }
}

server();