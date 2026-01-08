import express from "express";
import { checkAuthorization } from "../middlewares/user.js";

const router = express.Router();

router.get("/", (req, res) => {
  return res.redirect("/dashboard/registered");
});

router.get("/cancelled", async (req, res) => {
  const now = new Date();
  const cancelledEvents = await Registration.find({
    userId: req.user._id,
    status: "CANCELLED",
  })
    .populate({
      path: "eventId",
      select: "_id startTime endTime title shortDescription",
    })
    .lean()
    .filter((r) => r.eventId);
  return res.render("dashboard/cancelled", { cancelledEvents, now });
});

router.get("/registered", async (req, res) => {
  const now = new Date();
  const registeredEvents = await Registration.find({
    userId: req.user._id,
    status: "REGISTERED",
  })
    .populate({
      path: "eventId",
      select: "_id startTime endTime title shortDescription",
    })
    .lean()
    .filter((r) => r.eventId);
  return res.render("dashboard/registered", { registeredEvents, now });
});

export default router;
