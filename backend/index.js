import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";
import http from "http";
import { Server } from "socket.io";

import Registeruser from "./model.js";
import middleware from "./middleware.js";
import Msgmodel from "./Msgmodel.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({ origin: "*" }));

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

app.get("/", (req, res) => res.send("✅ Chat Server Running"));

// 🔹 Register
app.post("/register", async (req, res) => {
  try {
    const { username, email, password, confirmpassword } = req.body;
    if (!username || !email || !password || !confirmpassword)
      return res.status(400).send("All fields required");

    const exist = await Registeruser.findOne({ email });
    if (exist) return res.status(400).send("User already exists");

    if (password !== confirmpassword)
      return res.status(400).send("Passwords do not match");

    const newUser = new Registeruser({ username, email, password });
    await newUser.save();
    res.status(200).send("✅ Registered successfully");
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).send("Server Error");
  }
});

// 🔹 Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const exist = await Registeruser.findOne({ email });

    if (!exist) return res.status(400).send("No user found");
    if (exist.password !== password)
      return res.status(400).send("Invalid credentials");

    const payload = { user: { id: exist.id } };
    jwt.sign(payload, "jwtSecret", { expiresIn: "7d" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).send("Server Error");
  }
});

// 🔹 Profile
app.get("/myprofile", middleware, async (req, res) => {
  try {
    const exist = await Registeruser.findById(req.user.id).select("-password");
    if (!exist) return res.status(400).send("User not found");
    res.json(exist);
  } catch (err) {
    console.error("Profile Error:", err);
    res.status(500).send("Server Error");
  }
});

// 🔹 Delete All Chats
app.delete("/delete-all", async (req, res) => {
  try {
    const result = await Msgmodel.deleteMany({});
    io.emit("chats_cleared");
    res.json({
      message: `✅ All messages deleted (${result.deletedCount})`,
    });
  } catch (err) {
    res.status(500).json({ message: "Error deleting all data", error: err });
  }
});

// 🔹 SOCKET.IO
io.on("connection", async (socket) => {
  console.log("🟢 User connected:", socket.id);

  try {
    // Send old messages immediately after connection
    const allmsg = await Msgmodel.find().sort({ date: 1 });
    socket.emit("load_messages", allmsg);
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
  }

  // When user sends new message
  socket.on("send_message", async (msgData) => {
    try {
      const newMsg = new Msgmodel({
        username: msgData.username,
        text: msgData.text,
        date: msgData.date || new Date(),
      });
      await newMsg.save();
      io.emit("new_message", newMsg);
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });

  // Clear all messages
  socket.on("delete_all", async () => {
    await Msgmodel.deleteMany({});
    io.emit("chats_cleared");
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected:", socket.id);
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
