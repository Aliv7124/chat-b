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

*/

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

// ✅ SOCKET.IO EVENTS (Online Status + Last Seen)
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // ✅ When user comes online
  socket.on("userOnline", async (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    console.log(`✅ ${userId} is now online`);

    // Broadcast both: user-specific + all online list
    io.emit("userStatusChange", { userId, status: "online" });
    io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
  });

  // ✅ Join private chat room
  socket.on("joinRoom", ({ userId, receiverId }) => {
    const roomId = [userId, receiverId].sort().join("_");
    socket.join(roomId);
    console.log(`📥 ${userId} joined room ${roomId}`);
  });

  // ✅ Typing indicators
  socket.on("typing", (roomId) => socket.to(roomId).emit("typing", roomId));
  socket.on("stopTyping", (roomId) => socket.to(roomId).emit("stopTyping", roomId));

  // ✅ Send + receive messages in real time
  socket.on("sendMessage", (message) => {
    const roomId = [message.sender, message.receiver].sort().join("_");
    io.to(roomId).emit("receiveMessage", message);
  });

  // ✅ Handle disconnection
  socket.on("disconnect", async () => {
    console.log("🔴 User disconnected:", socket.id);
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      await User.findByIdAndUpdate(socket.userId, { lastSeen: new Date() });
      console.log(`⚫ ${socket.userId} went offline`);

      // Notify all clients
      io.emit("userStatusChange", {
        userId: socket.userId,
        status: "offline",
        lastSeen: new Date(),
      });
      io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
    }
  });
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
