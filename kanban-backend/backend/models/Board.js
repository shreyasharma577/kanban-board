import mongoose from "mongoose";

const columnSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const boardSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    columns: {
      type: [columnSchema],
      default: [
        { id: "todo", title: "To Do" },
        { id: "progress", title: "In Progress" },
        { id: "review", title: "Review" },
        { id: "done", title: "Done" }
      ]
    }
  },
  { timestamps: true }
);

export default mongoose.model("Board", boardSchema);