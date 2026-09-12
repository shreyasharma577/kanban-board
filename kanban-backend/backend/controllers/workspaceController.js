import Workspace from "../models/Workspace.js";
import Board from "../models/Board.js";
import Task from "../models/Task.js";

export async function createWorkspace(req, res, next) {
  try {
    const { name, description = "" } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Workspace name is required" });
    }

    const workspace = await Workspace.create({ name, description });
    res.status(201).json({ success: true, data: workspace });
  } catch (error) {
    next(error);
  }
}

export async function getWorkspaces(req, res, next) {
  try {
    const workspaces = await Workspace.find().sort({ createdAt: -1 });
    res.json({ success: true, data: workspaces });
  } catch (error) {
    next(error);
  }
}

export async function getWorkspace(req, res, next) {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    const boards = await Board.find({ workspaceId: workspace._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: { workspace, boards } });
  } catch (error) {
    next(error);
  }
}

export async function updateWorkspace(req, res, next) {
  try {
    const workspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name, description: req.body.description },
      { new: true, runValidators: true }
    );

    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    res.json({ success: true, data: workspace });
  } catch (error) {
    next(error);
  }
}

export async function deleteWorkspace(req, res, next) {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ success: false, message: "Workspace not found" });
    }

    const boards = await Board.find({ workspaceId: workspace._id }, "_id");
    const boardIds = boards.map((board) => board._id);

    await Task.deleteMany({ boardId: { $in: boardIds } });
    await Board.deleteMany({ workspaceId: workspace._id });
    await workspace.deleteOne();

    res.json({ success: true, message: "Workspace deleted" });
  } catch (error) {
    next(error);
  }
}