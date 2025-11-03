
/*
import express from "express";
import multer from "multer";
import path from "path";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Message from "../models/Message.js";

const router = express.Router();

// ✅ Storage setup for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder where all files go
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // ensure unique filename
  },
});

const upload = multer({ storage });

// ✅ Send message (text, file, or voice)
router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const file = req.file;

    if (!receiverId && !file && !content) {
      return res.status(400).json({
        message: "receiverId and message or file required",
      });
    }

    // ✅ Detect file type (image/audio/other)
    let fileUrl = null;
    let fileType = null;

    if (file) {
      fileUrl = `/uploads/${file.filename}`;
      const mime = file.mimetype;
      if (mime.startsWith("image/")) fileType = "image";
      else if (mime.startsWith("audio/")) fileType = "audio";
      else fileType = "file";
    }

    const message = await Message.create({
      sender: req.userId,
      receiver: receiverId,
      content: content || "",
      fileUrl,
      fileType,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Error sending message" });
  }
});

// ✅ Fetch all messages between two users
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const myId = req.userId;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
});

export default router;
*/

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Message from "../models/Message.js";

const router = express.Router();

// ✅ Ensure uploads folder exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ✅ Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ Send message (text, image, audio, or file)
router.post("/", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const file = req.file;

    console.log("👉 Message Request Body:", req.body);
    console.log("👉 Authenticated User ID:", req.userId);

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    let fileUrl = null;
    let fileType = null;

    if (file) {
      fileUrl = `/uploads/${file.filename}`;
      const mime = file.mimetype;
      if (mime.startsWith("image/")) fileType = "image";
      else if (mime.startsWith("audio/")) fileType = "audio";
      else fileType = "document"; // ✅ fix: use "document", not "file"
    }

    const message = await Message.create({
      sender: req.userId,
      receiver: receiverId,
      content: content || "",
      fileUrl,
      fileType,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ message: "Error sending message" });
  }
});

// ✅ Fetch all messages between logged user and selected user
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const myId = req.userId;

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ message: "Error fetching messages" });
  }
});

// ✅ Delete a message
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (
      message.sender.toString() !== req.userId &&
      message.receiver.toString() !== req.userId
    ) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    // ✅ Delete attached file if exists
    if (message.fileUrl) {
      const filePath = path.join(process.cwd(), message.fileUrl.replace(/^\/+/, ""));
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.warn("Failed to delete file:", err.message);
        });
      }
    }

    await message.deleteOne();
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting message:", error);
    res.status(500).json({ message: "Error deleting message" });
  }
});

export default router;
