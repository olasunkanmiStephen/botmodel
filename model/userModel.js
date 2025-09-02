import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';


const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    userId: { type: String, required: true, unique: true, default: uuidv4 }
})

export default mongoose.model("User", userSchema)