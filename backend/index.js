// index.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";

import Registeruser from "./model.js";
import middleware from "./middleware.js";
import Msgmodel from "./Msgmodel.js";

dotenv.config(); // load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ Mongo Error:", err));

// Routes

app.get("/", (req, res) => {
    res.send("hello world");
});

// Register
app.post("/register", async (req, res) => {
    try {
        const { username, email, password, confirmpassword } = req.body;
        let exist = await Registeruser.findOne({ email });
        if (exist) return res.status(400).send("User already exists");

        if (password !== confirmpassword)
            return res.status(400).send("Password and confirm password mismatch");

        const newUser = new Registeruser({ username, email, password, confirmpassword });
        await newUser.save();
        res.status(200).send("Registered successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send("Internal server error");
    }
});

// Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const exist = await Registeruser.findOne({ email });
        if (!exist) return res.status(400).send("No user with this email");

        if (exist.password !== password) return res.status(400).send("Invalid credentials");

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

// My profile
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

// Add message
app.post("/addmsg", middleware, async (req, res) => {
    try {
        const { text } = req.body;
        const user = await Registeruser.findById(req.user.id);

        const newMsg = new Msgmodel({
            user: req.user.id,
            username: user.username,
            text,
        });

        await newMsg.save();
        const allmsg = await Msgmodel.find();
        res.json(allmsg);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
});

// Get all messages
app.get("/getmsg", middleware, async (req, res) => {
    try {
        const allmsg = await Msgmodel.find();
        res.json(allmsg);
    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
});

// Delete all messages
app.delete("/delete-all", async (req, res) => {
    try {
        const result = await Msgmodel.deleteMany({});
        res.json({
            message: `✅ All messages deleted successfully (${result.deletedCount} records removed)`,
        });
    } catch (err) {
        res.status(500).json({ message: "Error deleting all data", error: err });
    }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
