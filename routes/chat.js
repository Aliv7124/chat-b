import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Chat from "../models/Chat.js";

const router = express.Router();

// Create or get existing private chat
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;

    let chat = await Chat.findOne({
      isGroupChat: false,
      members: { $all: [req.userId, userId] },
    }).populate("members", "-password");

    if (!chat) {
      chat = await Chat.create({ members: [req.userId, userId] });
      chat = await chat.populate("members", "-password");
    }

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: "Error creating/getting chat" });
  }
});

// Get all chats for logged-in user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ members: req.userId })
      .populate("members", "-password")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: "Error fetching chats" });
  }
});

export default router;
