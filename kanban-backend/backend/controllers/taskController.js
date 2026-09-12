import mongoose from "mongoose";
import Task from "../models/Task.js";
import Board from "../models/Board.js";

function validateObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function createTask(req, res, next) {
  try {
    const { boardId } = req.params;
    const {
      title,
      description = "",
      status = "todo",
      priority = "Medium",
      tag = "Product",
      due = "No due date",
      assignee = ""
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Task title is required" });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    const columnExists = board.columns.some((column) => column.id === status);
    if (!columnExists) {
      return res.status(400).json({ success: false, message: "Invalid task status" });
    }

    const lastTask = await Task.findOne({ boardId, status }).sort({ position: -1 });
    const position = lastTask ? lastTask.position + 1 : 0;

    const task = await Task.create({
      boardId,
      title,
      description,
      status,
      position,
      priority,
      tag,
      due,
      assignee
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

export async function getTasksByBoard(req, res, next) {
  try {
    const board = await Board.findById(req.params.boardId);
    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    const tasks = await Task.find({ boardId: req.params.boardId }).sort({ status: 1, position: 1 });
    res.json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
}

export async function getTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req, res, next) {
  try {
    const allowed = ["title", "description", "status", "priority", "tag", "due", "assignee", "position"];
    const updates = {};

    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (updates.status !== undefined) {
      const board = await Board.findById(task.boardId);
      if (!board?.columns.some((column) => column.id === updates.status)) {
        return res.status(400).json({ success: false, message: "Invalid task status" });
      }
    }

    Object.assign(task, updates);
    await task.save();

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

export async function moveTask(req, res, next) {
  try {
    const { status, position } = req.body;

    if (typeof status !== "string" || typeof position !== "number" || position < 0) {
      return res.status(400).json({
        success: false,
        message: "status and a non-negative numeric position are required"
      });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const board = await Board.findById(task.boardId);
    if (!board?.columns.some((column) => column.id === status)) {
      return res.status(400).json({ success: false, message: "Invalid target column" });
    }

    const oldStatus = task.status;
    const oldPosition = task.position;

    if (oldStatus === status) {
      const direction = position > oldPosition ? 1 : -1;
      await Task.updateMany(
        {
          boardId: task.boardId,
          status,
          _id: { $ne: task._id },
          position: direction === 1
            ? { $gt: oldPosition, $lte: position }
            : { $gte: position, $lt: oldPosition }
        },
        { $inc: { position: direction === 1 ? -1 : 1 } }
      );
    } else {
      await Task.updateMany(
        { boardId: task.boardId, status: oldStatus, position: { $gt: oldPosition } },
        { $inc: { position: -1 } }
      );

      await Task.updateMany(
        { boardId: task.boardId, status, position: { $gte: position } },
        { $inc: { position: 1 } }
      );
    }

    task.status = status;
    task.position = position;
    await task.save();

    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await Task.updateMany(
      {
        boardId: task.boardId,
        status: task.status,
        position: { $gt: task.position }
      },
      { $inc: { position: -1 } }
    );

    await task.deleteOne();

    res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    next(error);
  }
}