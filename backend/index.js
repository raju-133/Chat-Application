// index.js
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
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ Mongo Error:", err));

// Default route
app.get("/", (req, res) => res.send("✅ Server and Socket running"));

// Register route
app.post("/register", async (req, res) => {
  try {
    const { username, email, password, confirmpassword } = req.body;
    let exist = await Registeruser.findOne({ email });
    if (exist) return res.status(400).send("User already exists");

    if (password !== confirmpassword)
      return res.status(400).send("Password mismatch");

    const newUser = new Registeruser({ username, email, password });
    await newUser.save();
    res.status(200).send("Registered successfully");
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal server error");
  }
});

// Login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const exist = await Registeruser.findOne({ email });
    if (!exist) return res.status(400).send("No user with this email");
    if (exist.password !== password)
      return res.status(400).send("Invalid credentials");

    const payload = { user: { id: exist.id } };
    jwt.sign(payload, "jwtSecret", { expiresIn: 3600000 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error");
  }
});

// Profile route
app.get("/myprofile", middleware, async (req, res) => {
  try {
    const exist = await Registeruser.findById(req.user.id);
    if (!exist) return res.status(400).send("User not found");
    res.json(exist);
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

// Delete all chats
app.delete("/delete-all", async (req, res) => {
  try {
    const result = await Msgmodel.deleteMany({});
    io.emit("chats_cleared");
    res.json({
      message: `✅ All messages deleted (${result.deletedCount} records removed)`,
    });
  } catch (err) {
    res.status(500).json({ message: "Error deleting all data", error: err });
  }
});

// ✅ SOCKET.IO SECTION
io.on("connection", async (socket) => {
  console.log("🟢 User connected:", socket.id);

  // Send all existing messages to the client
  const allmsg = await Msgmodel.find().sort({ date: 1 });
  socket.emit("load_messages", allmsg);

  // Receive and broadcast new messages
  socket.on("send_message", async (msgData) => {
    try {
      const newMsg = new Msgmodel({
        username: msgData.username,
        text: msgData.text,
        date: msgData.date,
      });
      await newMsg.save();
      io.emit("new_message", newMsg);
    } catch (error) {
      console.error("❌ Error saving message:", error);
    }
  });

  // Clear all chats
  socket.on("delete_all", async () => {
    await Msgmodel.deleteMany({});
    io.emit("chats_cleared");
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
