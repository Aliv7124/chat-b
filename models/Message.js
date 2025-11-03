import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" }, // allow empty for file-only messages
    fileUrl: { type: String, default: null }, // store file path
    fileType: { type: String, enum: ["image", "audio", "document", null], default: null }, // optional file type
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
