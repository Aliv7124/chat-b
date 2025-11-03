
import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js"; 

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import chatRoutes from "./routes/chat.js";
import messageRoutes from "./routes/message.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
     origin: process.env.CLIENT_URL || "https://chat-nln7.vercel.app",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

// ✅ SOCKET.IO EVENTS (Last Seen Only)
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("userOnline", async (userId) => {
    socket.userId = userId;
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    console.log(`✅ Updated last seen for user ${userId}`);
  });

  socket.on("joinRoom", ({ userId, receiverId }) => {
    const roomId = [userId, receiverId].sort().join("_");
    socket.join(roomId);
    console.log(`📥 ${userId} joined room ${roomId}`);
  });

  socket.on("typing", (roomId) => {
    socket.to(roomId).emit("typing", roomId);
  });

  socket.on("stopTyping", (roomId) => {
    socket.to(roomId).emit("stopTyping", roomId);
  });

  socket.on("sendMessage", (message) => {
    const roomId = [message.sender, message.receiver].sort().join("_");
    io.to(roomId).emit("receiveMessage", message);
  });

  socket.on("disconnect", async () => {
    console.log("🔴 User disconnected:", socket.id);
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
      console.log(`⚫ Updated last seen for user ${socket.userId}`);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

/*
import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import chatRoutes from "./routes/chat.js";
import messageRoutes from "./routes/message.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

// ✅ SOCKET.IO EVENTS
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // ===== User Online Tracking =====
  socket.on("userOnline", async (userId) => {
    socket.userId = userId;
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    console.log(`✅ Updated last seen for user ${userId}`);
  });

  // ===== Join Private Room =====
  socket.on("joinRoom", ({ userId, receiverId }) => {
    const roomId = [userId, receiverId].sort().join("_");
    socket.join(roomId);
    console.log(`📥 ${userId} joined room ${roomId}`);
  });

  // ===== Typing Indicators =====
  socket.on("typing", (roomId) => {
    socket.to(roomId).emit("typing", roomId);
  });

  socket.on("stopTyping", (roomId) => {
    socket.to(roomId).emit("stopTyping", roomId);
  });

  // ===== Send / Receive Messages =====
  socket.on("sendMessage", (message) => {
    const roomId = [message.sender, message.receiver].sort().join("_");
    io.to(roomId).emit("receiveMessage", message);
  });

  // ====== 🔔 CALL FEATURE (WebRTC Signaling) ======

  // Step 1: Caller starts call
  socket.on("callUser", (data) => {
    console.log(`📞 ${data.from} is calling ${data.to}`);
    io.to(data.to).emit("incomingCall", {
      signal: data.signal,
      from: data.from,
      name: data.name,
    });
  });

  // Step 2: Callee answers
  socket.on("answerCall", (data) => {
    console.log(`✅ ${data.to} answered call from ${data.from}`);
    io.to(data.to).emit("callAccepted", data.signal);
  });

  // Step 3: ICE Candidate Exchange
  socket.on("iceCandidate", (data) => {
    io.to(data.to).emit("iceCandidate", data.candidate);
  });

  // Step 4: Call Ended
  socket.on("endCall", (data) => {
    io.to(data.to).emit("callEnded");
  });

  // ===== Disconnect =====
  socket.on("disconnect", async () => {
    console.log("🔴 User disconnected:", socket.id);
    if (socket.userId) {
      await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
      console.log(`⚫ Updated last seen for user ${socket.userId}`);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
*/