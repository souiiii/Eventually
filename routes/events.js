import express from "express";
import { checkAuthorization } from "../middlewares/user.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import mongoose from "mongoose";
import { registerAgain, registerNew } from "../services/registration.js";

const router = express.Router();

router.get("/", (req, res) => {
  return res.redirect("/events/discover");
});

router.get(
  "/discover",
  checkAuthorization(["ADMIN", "STUDENT"]),
  async (req, res) => {
    const { role } = req.user;
    const now = new Date();
    const { sort = "nearest", order = "asc" } = req.query;

    const sortParameter = new Map();

    // Add key-value pairs
    sortParameter.set("nearest", "startTime");
    sortParameter.set("deadline", "deadline");
    sortParameter.set("capacity", "capacity");
    sortParameter.set("upload-time", "updatedAt");

    const field = sortParameter.get(sort) ?? "startTime";
    const direction = order === "desc" ? -1 : 1;
    const sortObject = { [field]: direction };

    const [events, registeredEvents] = await Promise.all([
      Event.find({ endTime: { $gt: now } })
        .sort(sortObject)
        .lean(),
      Registration.find({ userId: req.user._id }).lean(),
    ]);

    return res.render("events/upcoming", {
      events,
      now,
      registeredEvents,
      role,
      user: req.user,
      url: "/discover",
    });
  }
);

router.get("/history", checkAuthorization(["ADMIN"]), async (req, res) => {
  const now = new Date();
  const { sort = "recent" } = req.query;

  const sortParameter = new Map();

  sortParameter.set("recent", ["startTime", "desc"]);
  sortParameter.set("oldest", ["startTime", "asc"]);
  sortParameter.set("upload-time", ["updatedAt", "desc"]);

  const [field, dirText] = sortParameter.get(sort) ?? ["startTime", "desc"];
  const direction = dirText === "desc" ? -1 : 1;
  const sortObject = { [field]: direction };

  const events = await Event.find({ endTime: { $lte: now } })
    .sort(sortObject)
    .lean();
  return res.render("events/past", {
    events,
    now,
    user: req.user,
    url: "/history",
  });
});

router.get(
  "/:id",
  checkAuthorization(["ADMIN", "STUDENT"]),
  async (req, res) => {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).send("Invalid id");

    const [eventDetails, registrationDetails] = await Promise.all([
      Event.findById(id).lean(),
      Registration.findOne({ userId: req.user._id, eventId: id }).lean(),
    ]);

    if (!eventDetails) return res.status(404).send("No such event exists");

    return res.render("events/eventDetails", {
      eventDetails,
      registrationDetails,
      role: req.user.role,
      user: req.user,
    });
  }
);

router.post(
  "/register/:id",
  checkAuthorization(["STUDENT"]),
  async (req, res) => {
    try {
      const eventId = req.params.id;
      const userId = req.user._id;

      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).send("Invalid Id");
      }

      const now = new Date();

      const regist = await Registration.findOne({
        eventId,
        userId,
      })
        .populate({ path: "eventId", select: "_id deadline" })
        .lean();

      if (regist) {
        if (!regist.eventId)
          return res.status(404).send("No such event exists");
        const deadline = regist.eventId.deadline;
        if (deadline < now)
          return res.status(400).send("Registration is closed");
        if (regist.status === "REGISTERED")
          return res.status(400).send("Already registered");
        await registerAgain(eventId, userId, deadline);
        return res.redirect(`/events/${eventId}`);
      }

      const event = await Event.findById(eventId).lean();
      if (!event) return res.status(404).send("No such event exists");
      const deadline = event.deadline;
      await registerNew(eventId, userId, deadline);

      return res.redirect(`/events/${eventId}`);
    } catch (err) {
      console.log("Error: ", err.message);
      return res.status(500).render("common/server-error");
    }
  }
);

router.post(
  "/de-register/:id",
  checkAuthorization(["STUDENT"]),
  async (req, res) => {
    try {
      const eventId = req.params.id;
      const userId = req.user._id;

      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).send("Invalid Id");
      }

      const now = new Date();

      const event = await Event.findById(eventId).lean();
      if (!event) return res.status(404).send("No such event exists");
      if (event.deadline < now)
        return res.status(400).send("Cannot deregister now");

      const regist = await Registration.findOneAndUpdate(
        {
          eventId,
          userId,
          status: "REGISTERED",
        },
        { $set: { status: "CANCELLED", registrationCode: null } },
        { runValidators: true }
      ).lean();

      if (!regist) return res.status(400).send("Invalid request");

      return res.redirect(`/events/${eventId}`);
    } catch (err) {
      console.log("Error: ", err.message);
      return res.status(500).render("common/server-error");
    }
  }
);

export default router;
