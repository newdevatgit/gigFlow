import express from "express";
import { createGig, getGigs } from "../controllers/gigController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(getGigs)
  .post(protect, createGig);

export default router;
