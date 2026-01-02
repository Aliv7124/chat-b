/*

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

  // ===== 1. USER PRESENCE =====
  socket.on("user-online", async (userId) => {
    socket.userId = userId;
    onlineUsers.set(userId, socket.id);
    
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      io.emit("user-status", { userId, status: "online" });
      io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
    } catch (err) {
      console.error("Status Update Error:", err);
    }
  });

  // ===== 2. ROOM LOGIC =====
  socket.on("joinRoom", ({ userId, receiverId }) => {
    const roomId = [userId, receiverId].sort().join("_");
    socket.join(roomId);
  });

  // ===== 3. CHAT MESSAGING =====
  socket.on("sendMessage", (message) => {
    const roomId = [message.sender, message.receiver].sort().join("_");
    
    // Broadcast to the specific room (reaches both users instantly)
    io.to(roomId).emit("receiveMessage", message);

    // Backup: Push to specific socket if receiver is not in room
    const targetSocket = onlineUsers.get(message.receiver);
    if (targetSocket) {
      io.to(targetSocket).emit("receiveMessage", message);
    }
  });

  socket.on("typing", (roomId) => socket.to(roomId).emit("typing"));
  socket.on("stopTyping", (roomId) => socket.to(roomId).emit("stopTyping"));

  // ===== 4. DELETE MESSAGE RELAY =====
  socket.on("deleteMessage", ({ messageId, receiverId }) => {
    const roomId = [socket.userId, receiverId].sort().join("_");
    // Emitting { messageId } so frontend filter(m => m._id !== messageId) works
    io.to(roomId).emit("messageDeleted", { messageId });
  });

  // ===== 5. CALL SYSTEM =====
  socket.on("call-user", ({ from, to, type }) => {
    if (activeCalls.has(to)) {
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
    activeCalls.set(from, to);
    activeCalls.set(to, from);

    const callerSocket = onlineUsers.get(to);
    if (callerSocket) {
      io.to(callerSocket).emit("call-accepted", { from });
    }
  });

  socket.on("reject-call", ({ to }) => {
    const callerSocket = onlineUsers.get(to);
    if (callerSocket) {
      io.to(callerSocket).emit("call-rejected");
    }
  });

  // ===== 6. WEBRTC SIGNALING =====
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

  socket.on("end-call", ({ to }) => {
    activeCalls.delete(socket.userId);
    activeCalls.delete(to);
    const target = onlineUsers.get(to);
    if (target) {
      io.to(target).emit("call-ended");
    }
  });

  // ===== 7. DISCONNECT LOGIC =====
  socket.on("disconnect", async () => {
    const userId = socket.userId;
    if (userId) {
      const partnerId = activeCalls.get(userId);
      if (partnerId) {
        const partnerSocket = onlineUsers.get(partnerId);
        if (partnerSocket) io.to(partnerSocket).emit("call-ended");
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
*/




import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

// Models
import User from "./models/User.js";
import Message from "./models/Message.js";

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import messageRoutes from "./routes/message.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*", 
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

const onlineUsers = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  
  // 1. User Presence
  socket.on("user-online", async (userId) => {
    if (!userId) return;
    socket.userId = String(userId);
    onlineUsers.set(String(userId), socket.id);
    
    io.emit("userStatusChange", { userId: socket.userId, status: "online" });
    io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));

    try {
      await Message.updateMany(
        { receiver: socket.userId, status: "sent" },
        { $set: { status: "delivered" } }
      );
    } catch (err) { console.error(err); }
  });

  // 2. Room Logic
  socket.on("joinChat", (roomId) => {
    socket.join(roomId);
  });

  // 3. Real-Time Messaging & Ticks
  socket.on("sendMessage", async (message) => {
    const roomId = [String(message.sender), String(message.receiver)].sort().join("_");
    const receiverSocket = onlineUsers.get(String(message.receiver));

    if (receiverSocket) {
      // ✅ Update DB to delivered
      await Message.findByIdAndUpdate(message._id, { status: "delivered" });
      
      // ✅ Send to receiver
      io.to(receiverSocket).emit("receiveMessage", { ...message, status: "delivered" });
      
      // ✅ Notify sender's other tabs/devices
      socket.emit("messageStatusUpdate", { messageId: message._id, status: "delivered" });
    }
  });

  // 4. Blue Tick (Seen) Logic
  socket.on("messageSeen", async ({ messageId, senderId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { status: "seen" });
      const senderSocket = onlineUsers.get(String(senderId));
      
      if (senderSocket) {
        // ✅ Tell the sender to turn the ticks BLUE
        io.to(senderSocket).emit("messageStatusUpdate", { messageId, status: "seen" });
      }
    } catch (err) { console.error(err); }
  });

  // 5. Typing Indicators
  socket.on("typing", ({ roomId }) => {
    // ✅ Send to everyone in room EXCEPT the sender
    socket.to(roomId).emit("typing", { senderId: socket.userId });
  });

  socket.on("stopTyping", ({ roomId }) => {
    socket.to(roomId).emit("stopTyping", { senderId: socket.userId });
  });

  // 6. Delete Message (Vanish)
  socket.on("deleteMessage", ({ messageId, receiverId }) => {
    const roomId = [String(socket.userId), String(receiverId)].sort().join("_");
    // ✅ Use io.to(roomId) so it vanishes for BOTH users simultaneously
    io.to(roomId).emit("messageDeleted", messageId);
  });

  // 7. Signaling (WebRTC)
  socket.on("call-user", ({ from, to, type }) => {
    const targetSocket = onlineUsers.get(String(to));
    if (targetSocket) io.to(targetSocket).emit("incoming-call", { from, type });
  });

  socket.on("webrtc-offer", ({ to, offer }) => {
    const target = onlineUsers.get(String(to));
    if (target) io.to(target).emit("webrtc-offer", { offer, from: socket.userId });
  });

  socket.on("webrtc-answer", ({ to, answer }) => {
    const target = onlineUsers.get(String(to));
    if (target) io.to(target).emit("webrtc-answer", { answer, from: socket.userId });
  });

  socket.on("webrtc-ice", ({ to, candidate }) => {
    const target = onlineUsers.get(String(to));
    if (target) io.to(target).emit("webrtc-ice", { candidate, from: socket.userId });
  });

  socket.on("disconnect", async () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      const lastSeen = new Date();
      await User.findByIdAndUpdate(socket.userId, { lastSeen });
      io.emit("userStatusChange", { userId: socket.userId, status: "offline", lastSeen });
      io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server on port ${PORT}`));