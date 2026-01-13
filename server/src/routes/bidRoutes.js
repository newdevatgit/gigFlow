import express from "express";
import { submitBid, getBidsForGig } from "../controllers/bidController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, submitBid);
router.get("/:gigId", protect, getBidsForGig);

export default router;
