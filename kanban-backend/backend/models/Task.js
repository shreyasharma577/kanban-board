import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: ""
    },
    status: {
      type: String,
      required: true,
      trim: true,
      default: "todo"
    },
    position: {
      type: Number,
      required: true,
      default: 0
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Done"],
      default: "Medium"
    },
    tag: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "Product"
    },
    due: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "No due date"
    },
    assignee: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ""
    }
  },
  { timestamps: true }
);

taskSchema.index({ boardId: 1, status: 1, position: 1 });

export default mongoose.model("Task", taskSchema);