import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// 1. Get all users except current
router.get("/", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// 2. Get current user profile (for Sidebar)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// 3. Update profile (Bio and Avatar)
router.put("/update-profile", authMiddleware, async (req, res) => {
  try {
    const { bio, avatar } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId, 
      { $set: { bio, avatar } },
      { new: true, runValidators: false }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json(user);
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

// 4. Get specific user details (Bio, Photo, and Last Seen)
// We combined the two /:id routes into this single one.
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name avatar lastSeen bio email"); // Added 'bio' and 'email' here
      
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user details" });
  }
});

export default router;