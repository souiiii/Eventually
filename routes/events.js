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
    const { role } = req.user.role;
    const now = new Date();
    const [events, registeredEvents] = await Promise.all([
      Event.find({ endTime: { $gt: now } }).lean(),
      Registration.find({ userId: req.user._id }).lean(),
    ]);
    return res.render("events/upcoming", {
      events,
      now,
      registeredEvents,
      role,
    });
  }
);

router.get("/history", checkAuthorization(["ADMIN"]), async (req, res) => {
  const now = new Date();
  const events = await Event.find({ endTime: { $lte: now } }).lean();
  return res.render("events/past", { events, now });
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
