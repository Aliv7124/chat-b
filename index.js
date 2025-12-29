/*
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

const onlineUsers = new Map(); // userId -> socketId
const activeCalls = new Map(); // userId -> partnerId (Bi-directional)

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
    // Check if receiver is online and not already in a call
    if (activeCalls.has(to) || activeCalls.has(from)) {
      socket.emit("call-busy");
      return;
    }
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", { from, type });
    } else {
      socket.emit("user-offline");
    }
  });

  socket.on("accept-call", ({ to }) => {
    const from = socket.userId;
    // Link both users in activeCalls
    activeCalls.set(from, to);
    activeCalls.set(to, from);

    const targetSocket = onlineUsers.get(to);
    if (targetSocket) io.to(targetSocket).emit("call-accepted");
  });

  socket.on("reject-call", ({ to }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) io.to(targetSocket).emit("call-rejected");
  });

  // ===== WEBRTC SIGNALING =====
  socket.on("webrtc-offer", ({ to, offer }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("webrtc-offer", { offer, from: socket.userId });
  });

  socket.on("webrtc-answer", ({ to, answer }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("webrtc-answer", { answer, from: socket.userId });
  });

  socket.on("webrtc-ice", ({ to, candidate }) => {
    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("webrtc-ice", { candidate, from: socket.userId });
  });

  socket.on("end-call", ({ to }) => {
    // Clean up both users from activeCalls
    activeCalls.delete(socket.userId);
    activeCalls.delete(to);

    const target = onlineUsers.get(to);
    if (target) io.to(target).emit("call-ended");
  });

  // ===== DISCONNECT =====
  socket.on("disconnect", async () => {
    const userId = socket.userId;
    if (userId) {
      // If user was in a call, notify the partner
      const partnerId = activeCalls.get(userId);
      if (partnerId) {
        const partnerSocket = onlineUsers.get(partnerId);
        if (partnerSocket) io.to(partnerSocket).emit("call-ended");
        activeCalls.delete(partnerId);
      }

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
*/


import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import User from "./models/User.js";

// Route Imports
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
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// State Management
const onlineUsers = new Map(); // userId -> socketId
const activeCalls = new Map(); // userId -> partnerId

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  // ===== USER PRESENCE =====
  socket.on("user-online", async (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
    
    // Update DB status
    await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
    
    // Broadcast status to others
    io.emit("user-status", { userId, status: "online" });
    io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
  });

  // ===== CHAT LOGIC =====
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

  // ===== CALL SYSTEM (THE HANDSHAKE) =====

  // 1. Initial Offer to Call
  socket.on("call-user", ({ from, to, type }) => {
    if (activeCalls.has(to)) {
      socket.emit("call-busy");
      return;
    }
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      // Send the incoming call notification to the Callee
      io.to(targetSocket).emit("incoming-call", { from, type });
    } else {
      socket.emit("user-offline");
    }
  });

  // 2. Callee Accepts the Call
  socket.on("accept-call", ({ to }) => {
    const from = socket.userId;
    // Track that these two are now in a call
    activeCalls.set(from, to);
    activeCalls.set(to, from);

    const callerSocket = onlineUsers.get(to);
    if (callerSocket) {
      // Notify the Caller that they can now start WebRTC negotiation
      io.to(callerSocket).emit("call-accepted", { from });
    }
  });

  // 3. Callee Rejects the Call
  socket.on("reject-call", ({ to }) => {
    const callerSocket = onlineUsers.get(to);
    if (callerSocket) {
      io.to(callerSocket).emit("call-rejected");
    }
  });

  // ===== WEBRTC SIGNALING (PASS-THROUGH) =====

  socket.on("webrtc-offer", ({ to, offer }) => {
    const target = onlineUsers.get(to);
    if (target) {
      io.to(target).emit("webrtc-offer", { offer, from: socket.userId });
    }
  });

  socket.on("webrtc-answer", ({ to, answer }) => {
    const target = onlineUsers.get(to);
    if (target) {
      io.to(target).emit("webrtc-answer", { answer, from: socket.userId });
    }
  });

  socket.on("webrtc-ice", ({ to, candidate }) => {
    const target = onlineUsers.get(to);
    if (target) {
      io.to(target).emit("webrtc-ice", { candidate, from: socket.userId });
    }
  });

  // 4. End Call
  socket.on("end-call", ({ to }) => {
    activeCalls.delete(socket.userId);
    activeCalls.delete(to);

    const target = onlineUsers.get(to);
    if (target) {
      io.to(target).emit("call-ended");
    }
  });

  // ===== DISCONNECT LOGIC =====
  socket.on("disconnect", async () => {
    const userId = socket.userId;
    if (userId) {
      // If user was in a call, notify their partner immediately
      const partnerId = activeCalls.get(userId);
      if (partnerId) {
        const partnerSocket = onlineUsers.get(partnerId);
        if (partnerSocket) {
          io.to(partnerSocket).emit("call-ended");
        }
        activeCalls.delete(partnerId);
      }

      onlineUsers.delete(userId);
      activeCalls.delete(userId);
      
      const lastSeenDate = new Date();
      await User.findByIdAndUpdate(userId, { lastSeen: lastSeenDate });
      
      io.emit("user-status", { userId, status: "offline", lastSeen: lastSeenDate });
      io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));