import Board from "../models/Board.js";
import Workspace from "../models/Workspace.js";
import Task from "../models/Task.js";

const defaultColumns = [
  { id: "todo", title: "To Do" },
  { id: "progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" }
];

export async function createBoard(req, res, next) {
  try {
    const { workspaceId } = req.params;
    const { name, description = "", columns = defaultColumns } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Board name is required" });
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    const board = await Board.create({
      workspaceId,
      name,
      description,
      columns
    });

    res.status(201).json({ success: true, data: board });
  } catch (error) {
    next(error);
  }
}

export async function getBoardsByWorkspace(req, res, next) {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    const boards = await Board.find({ workspaceId: req.params.workspaceId }).sort({ createdAt: -1 });
    res.json({ success: true, data: boards });
  } catch (error) {
    next(error);
  }
}

export async function getBoard(req, res, next) {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    const tasks = await Task.find({ boardId: board._id }).sort({ status: 1, position: 1 });
    res.json({ success: true, data: { board, tasks } });
  } catch (error) {
    next(error);
  }
}

export async function updateBoard(req, res, next) {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.columns !== undefined) updates.columns = req.body.columns;

    const board = await Board.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    res.json({ success: true, data: board });
  } catch (error) {
    next(error);
  }
}

export async function deleteBoard(req, res, next) {
  try {
    const board = await Board.findByIdAndDelete(req.params.id);
    if (!board) {
      return res.status(404).json({ success: false, message: "Board not found" });
    }

    await Task.deleteMany({ boardId: board._id });

    res.json({ success: true, message: "Board and its tasks deleted" });
  } catch (error) {
    next(error);
  }
}