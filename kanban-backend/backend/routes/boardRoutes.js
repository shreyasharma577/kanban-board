import express from "express";
import {
  createBoard,
  getBoardsByWorkspace,
  getBoard,
  updateBoard,
  deleteBoard
} from "../controllers/boardController.js";

const router = express.Router();

router.post("/workspace/:workspaceId", createBoard);
router.get("/workspace/:workspaceId", getBoardsByWorkspace);

router.route("/:id")
  .get(getBoard)
  .put(updateBoard)
  .delete(deleteBoard);

export default router;