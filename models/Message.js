import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" }, 
    fileUrl: { type: String, default: null }, 
    fileType: { type: String, enum: ["image", "audio", "document", null], default: null },
    // --- Added for Tick System ---
    status: { 
      type: String, 
      enum: ["sent", "delivered", "seen"], 
      default: "sent" 
    },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);