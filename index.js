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
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // Clean up legacy messages: Ensure everything has at least a 'sent' status
    const result = await Message.updateMany(
      { status: { $exists: false } }, 
      { $set: { status: "sent" } } 
    );
    if(result.modifiedCount > 0) {
        console.log(`🧹 Cleaned up ${result.modifiedCount} legacy messages.`);
    }
  })
  .catch((err) => console.error("❌ MongoDB Error:", err));

// State Management
const onlineUsers = new Map(); // userId (String) -> socketId
const activeCalls = new Map(); // userId -> partnerId

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  // ===== 1. USER PRESENCE & BULK DELIVERY CATCH-UP =====
  socket.on("user-online", async (userId) => {
    if (!userId) return;
    const stringId = String(userId);
    socket.userId = stringId;
    onlineUsers.set(stringId, socket.id);
    
    try {
      // Update user status to online in DB
      await User.findByIdAndUpdate(stringId, { lastSeen: new Date() });
      io.emit("user-status", { userId: stringId, status: "online" });
      io.emit("updateOnlineUsers", Array.from(onlineUsers.keys()));

      // --- FIX: BULK DELIVERY LOGIC ---
      // 1. Find all messages sent TO this user that are currently only 'sent'
      const pendingMessages = await Message.find({ 
        receiver: stringId, 
        status: "sent" 
      });

      if (pendingMessages.length > 0) {
        const messageIds = pendingMessages.map(m => m._id);
        
        // 2. Update DB to 'delivered' status
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { status: "delivered" } }
        );

        // 3. Group by Sender to notify them in bulk
        const groupedBySender = pendingMessages.reduce((acc, msg) => {
          const sId = String(msg.sender);
          if (!acc[sId]) acc[sId] = [];
          acc[sId].push(msg._id);
          return acc;
        }, {});

        // 4. Emit the bulk update to each online sender
        Object.keys(groupedBySender).forEach(senderId => {
          const senderSocket = onlineUsers.get(senderId);
          if (senderSocket) {
            io.to(senderSocket).emit("messages-delivered-bulk", { 
              messageIds: groupedBySender[senderId], 
              status: "delivered" 
            });
          }
        });
      }
    } catch (err) {
      console.error("Status/Delivery Update Error:", err);
    }
  });

  // ===== 2. ROOM LOGIC =====
  socket.on("joinRoom", ({ userId, receiverId }) => {
    const roomId = [String(userId), String(receiverId)].sort().join("_");
    socket.join(roomId);
  });

  // ===== 3. CHAT MESSAGING =====
  socket.on("sendMessage", async (message) => {
    const roomId = [String(message.sender), String(message.receiver)].sort().join("_");
    const receiverId = String(message.receiver);
    const targetSocket = onlineUsers.get(receiverId);

    let updatedStatus = "sent";

    if (targetSocket) {
      // Receiver is online -> Move to delivered instantly
      updatedStatus = "delivered";
      try {
        await Message.findByIdAndUpdate(message._id, { status: "delivered" });
      } catch (err) {
        console.error("Error updating status to delivered:", err);
      }
      
      // Emit to receiver
      io.to(targetSocket).emit("receiveMessage", { ...message, status: "delivered" });
    }

    // Emit status back to sender's UI
    socket.emit("message-status-updated", { 
      messageId: message._id, 
      status: updatedStatus 
    });
    
    // Broadcast to other devices of the same user in that room
    socket.to(roomId).emit("receiveMessage", { ...message, status: updatedStatus });
  });

  // ===== 4. MARK AS SEEN (BLUE TICK LOGIC) =====
  socket.on("mark-as-seen", async ({ messageIds, senderId, userId }) => {
    try {
      await Message.updateMany(
        { _id: { $in: messageIds } },
        { $set: { status: "seen" } }
      );

      const senderSocket = onlineUsers.get(String(senderId));
      if (senderSocket) {
        io.to(senderSocket).emit("messages-seen-update", { 
          messageIds, 
          receiverId: String(userId) 
        });
      }
    } catch (err) {
      console.error("Mark as seen error:", err);
    }
  });

  // ===== 5. TYPING & DELETE =====
  socket.on("typing", (roomId) => socket.to(roomId).emit("typing"));
  socket.on("stopTyping", (roomId) => socket.to(roomId).emit("stopTyping"));

  socket.on("deleteMessage", ({ messageId, receiverId }) => {
    const roomId = [String(socket.userId), String(receiverId)].sort().join("_");
    io.to(roomId).emit("messageDeleted", { messageId });
  });

  // ===== 6. CALL SYSTEM =====
  socket.on("call-user", ({ from, to, type }) => {
    if (activeCalls.has(String(to))) {
      socket.emit("call-busy");
      return;
    }
    const targetSocket = onlineUsers.get(String(to));
    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", { from, type });
    } else {
      socket.emit("user-offline");
    }
  });

  socket.on("accept-call", ({ to }) => {
    const from = String(socket.userId);
    const targetId = String(to);
    activeCalls.set(from, targetId);
    activeCalls.set(targetId, from);
    const callerSocket = onlineUsers.get(targetId);
    if (callerSocket) io.to(callerSocket).emit("call-accepted", { from });
  });

  socket.on("reject-call", ({ to }) => {
    const callerSocket = onlineUsers.get(String(to));
    if (callerSocket) io.to(callerSocket).emit("call-rejected");
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

  socket.on("end-call", ({ to }) => {
    activeCalls.delete(String(socket.userId));
    activeCalls.delete(String(to));
    const target = onlineUsers.get(String(to));
    if (target) io.to(target).emit("call-ended");
  });

  // ===== 7. DISCONNECT =====
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