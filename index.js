/*
import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
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

// SOCKET.IO EVENTS (Online Status + Last Seen)
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // ✅ Emit current online users immediately
  socket.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));

  // ✅ When user comes online
  socket.on("userOnline", async (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    console.log(`✅ ${userId} is now online`);

    // Broadcast instantly
    io.emit("userStatusChange", { userId, status: "online" });
    io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
  });

  // ✅ Client can request online users anytime
  socket.on("getOnlineUsers", () => {
    socket.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
  });

  // ✅ Join private chat room
  socket.on("joinRoom", ({ userId, receiverId }) => {
    const roomId = [userId, receiverId].sort().join("_");
    socket.join(roomId);
    console.log(`📥 ${userId} joined room ${roomId}`);
  });

  // ✅ Typing indicators
  socket.on("typing", (roomId) => socket.to(roomId).emit("typing"));
  socket.on("stopTyping", (roomId) => socket.to(roomId).emit("stopTyping"));

  // ✅ Send + receive messages
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

      io.emit("userStatusChange", {
        userId: socket.userId,
        status: "offline",
        lastSeen: new Date(),
      });
      io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
    }
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
*/
/*
import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import User from "./models/User.js";

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
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

const onlineUsers = new Map();
const activeCalls = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("user-online", (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
    io.emit("user-status", { userId, status: "online" });
  });

  // CALL USER
  socket.on("call-user", ({ from, to, type }) => {
    if (activeCalls.has(to)) {
      socket.emit("call-busy");
      return;
    }

    activeCalls.set(from, to);
    activeCalls.set(to, from);

    const target = onlineUsers.get(to);
    if (target) {
      io.to(target).emit("incoming-call", { from, type });
    }
  });

  socket.on("accept-call", ({ to }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("call-accepted");
  });

  socket.on("reject-call", ({ to }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("call-ended");
  });

  socket.on("webrtc-offer", ({ to, offer }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("webrtc-offer", { offer });
  });

  socket.on("webrtc-answer", ({ to, answer }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("webrtc-answer", { answer });
  });

  socket.on("webrtc-ice", ({ to, candidate }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("webrtc-ice", { candidate });
  });

  socket.on("end-call", ({ to }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("call-ended");
    activeCalls.delete(to);
    activeCalls.delete(socket.userId);
  });

  socket.on("disconnect", () => {
    const peer = activeCalls.get(socket.userId);
    if (peer) {
      const target = onlineUsers.get(peer);
      if (target) io.to(target).emit("call-ended");
    }

    activeCalls.delete(socket.userId);
    onlineUsers.delete(socket.userId);
  });
});

server.listen(5000, () => console.log("Server running on 5000"));
*/


 
import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import User from "./models/User.js";

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

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

const onlineUsers = new Map();
const activeCalls = new Map();

io.on("connection", (socket) => {
  // ===== USER ONLINE =====
  socket.on("user-online", async (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    io.emit("user-status", { userId, status: "online" });
    io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
  });

  socket.on("getOnlineUsers", () => {
    socket.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
  });

  // ===== CHAT ROOM =====
  socket.on("joinRoom", ({ userId, receiverId }) => {
    const roomId = [userId, receiverId].sort().join("_");
    socket.join(roomId);
  });

  socket.on("typing", (roomId) => socket.to(roomId).emit("typing"));
  socket.on("stopTyping", (roomId) => socket.to(roomId).emit("stopTyping"));

  socket.on("sendMessage", (message) => {
    const roomId = [message.sender, message.receiver].sort().join("_");
    io.to(roomId).emit("receiveMessage", message);
  });

  // ===== CALL SYSTEM =====
  socket.on("call-user", ({ from, to, type }) => {
    if (activeCalls.has(from) || activeCalls.has(to)) {
      socket.emit("call-busy");
      return;
    }
    activeCalls.set(from, to);
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("incoming-call", { from, type });
  });

  socket.on("accept-call", ({ from }) => {
    const target = onlineUsers.get(from);
    if (target) io.to(target).emit("call-accepted");
  });

  socket.on("reject-call", ({ from }) => {
    const target = onlineUsers.get(from);
    if (target) io.to(target).emit("call-ended");
    activeCalls.delete(from);
  });

  // ===== WEBRTC SIGNALING =====
  socket.on("webrtc-offer", ({ to, offer }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("webrtc-offer", { offer });
  });

  socket.on("webrtc-answer", ({ to, answer }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("webrtc-answer", { answer });
  });

  socket.on("webrtc-ice", ({ to, candidate }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("webrtc-ice", { candidate });
  });

  socket.on("end-call", ({ to }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("call-ended");
    activeCalls.delete(socket.userId);
    activeCalls.delete(to);
  });

  // ===== DISCONNECT =====
  socket.on("disconnect", async () => {
    const userId = socket.userId;
    if (userId) {
      onlineUsers.delete(userId);
      activeCalls.delete(userId);
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      io.emit("user-status", { userId, status: "offline", lastSeen: new Date() });
      io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
