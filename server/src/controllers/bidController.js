import mongoose from "mongoose";
import Bid from "../models/Bid.js";
import Gig from "../models/Gig.js";

/**
 * @desc Submit a bid for a gig
 * @route POST /api/bids
 * @access Private (Freelancer)
 */
export const submitBid = async (req, res) => {
  try {
    const { gigId, message, price } = req.body;

    if (!gigId || !message || !price) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const gig = await Gig.findById(gigId);
    if (!gig || gig.status !== "open") {
      return res.status(400).json({ message: "Gig is not open for bidding" });
    }

    // Prevent owner from bidding on own gig
    if (gig.owner.toString() === req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You cannot bid on your own gig" });
    }

    // Prevent duplicate bids by same freelancer
    const existingBid = await Bid.findOne({
      gig: gigId,
      freelancer: req.user._id,
    });

    if (existingBid) {
      return res
        .status(400)
        .json({ message: "You have already bid on this gig" });
    }

    const bid = await Bid.create({
      gig: gigId,
      freelancer: req.user._id,
      message,
      price,
    });

    res.status(201).json(bid);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Get all bids for a specific gig (owner only)
 * @route GET /api/bids/:gigId
 * @access Private (Client)
 */
export const getBidsForGig = async (req, res) => {
  try {
    const { gigId } = req.params;

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    // Only owner can view bids
    if (gig.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to view bids" });
    }

    const bids = await Bid.find({ gig: gigId })
      .populate("freelancer", "name email")
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Hire a freelancer for a gig (atomic)
 * @route PATCH /api/bids/:bidId/hire
 * @access Private (Gig Owner)
 */
export const hireBid = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { bidId } = req.params;

    const bid = await Bid.findById(bidId).session(session);
    if (!bid) {
      throw new Error("Bid not found");
    }

    const gig = await Gig.findById(bid.gig).session(session);
    if (!gig) {
      throw new Error("Gig not found");
    }

    // Only gig owner can hire
    if (gig.owner.toString() !== req.user._id.toString()) {
      throw new Error("Not authorized to hire");
    }

    // Prevent double hiring
    if (gig.status === "assigned") {
      throw new Error("Gig already assigned");
    }

    // Mark gig as assigned
    gig.status = "assigned";
    await gig.save({ session });

    // Mark selected bid as hired
    bid.status = "hired";
    await bid.save({ session });

    // Reject all other bids
    await Bid.updateMany(
      {
        gig: gig._id,
        _id: { $ne: bid._id },
      },
      { status: "rejected" },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Freelancer hired successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({ message: error.message });
  }
};
