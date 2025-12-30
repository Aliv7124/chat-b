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

   

// 5. DELETE MESSAGE REAL-TIME RELAY
socket.on("deleteMessage", ({ msgId, roomId }) => {
  // We use .to(roomId) to tell everyone in that specific chat 
  // to remove that message ID from their local state.
  io.to(roomId).emit("messageDeleted", msgId);
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