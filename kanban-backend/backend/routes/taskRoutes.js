import express from "express";
import {
  createTask,
  getTasksByBoard,
  getTask,
  updateTask,
  moveTask,
  deleteTask
} from "../controllers/taskController.js";

const router = express.Router();

router.post("/board/:boardId", createTask);
router.get("/board/:boardId", getTasksByBoard);

router.get("/:id", getTask);
router.put("/:id", updateTask);
router.patch("/:id/move", moveTask);
router.delete("/:id", deleteTask);

export default router;