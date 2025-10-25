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

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// Default route
app.get("/", (req, res) => res.send("✅ Server and Socket running"));

// ✅ REGISTER ROUTE
app.post("/register", async (req, res) => {
  try {
    console.log("📩 Register request received:", req.body);

    const { username, email, password, confirmpassword } = req.body;

    if (!username || !email || !password || !confirmpassword) {
      console.log("❌ Missing fields");
      return res.status(400).send("All fields are required");
    }

    let exist = await Registeruser.findOne({ email });
    if (exist) {
      console.log("❌ User already exists");
      return res.status(400).send("User already exists");
    }

    if (password !== confirmpassword) {
      console.log("❌ Passwords do not match");
      return res.status(400).send("Passwords do not match");
    }

    const newUser = new Registeruser({ username, email, password });
    await newUser.save();

    console.log("✅ New user registered:", newUser.email);
    return res.status(200).send("✅ Registered successfully");
  } catch (err) {
    console.error("💥 Internal Server Error:", err);
    return res.status(500).send("Internal Server Error: " + err.message);
  }
});


// ✅ LOGIN ROUTE
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const exist = await Registeruser.findOne({ email });

    if (!exist) return res.status(400).send("No user with this email");
    if (exist.password !== password)
      return res.status(400).send("Invalid credentials");

    const payload = { user: { id: exist.id } };
    jwt.sign(payload, "jwtSecret", { expiresIn: "1h" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error("❌ Error in /login:", err);
    res.status(500).send("Server Error");
  }
});

// ✅ PROFILE ROUTE
app.get("/myprofile", middleware, async (req, res) => {
  try {
    const exist = await Registeruser.findById(req.user.id);
    if (!exist) return res.status(400).send("User not found");
    res.json(exist);
  } catch (err) {
    console.error("❌ Error in /myprofile:", err);
    res.status(500).send("Server Error");
  }
});

// ✅ DELETE ALL CHATS
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

// ✅ SOCKET.IO
io.on("connection", async (socket) => {
  console.log("🟢 User connected:", socket.id);

  const allmsg = await Msgmodel.find().sort({ date: 1 });
  socket.emit("load_messages", allmsg);

  socket.on("send_message", async (msgData) => {
    try {
      const newMsg = new Msgmodel(msgData);
      await newMsg.save();
      io.emit("new_message", newMsg);
    } catch (error) {
      console.error("❌ Error saving message:", error);
    }
  });

  socket.on("delete_all", async () => {
    await Msgmodel.deleteMany({});
    io.emit("chats_cleared");
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// Start Server
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
