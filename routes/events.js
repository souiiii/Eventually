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
    const success = req.query.success;
    const now = new Date();
    let sort = req.query?.sort;
    if (!sort) sort = "nearest_asc";
    let sortt = sort.split("_")[0];
    let order = sort.split("_")[1];

    const sortParameter = new Map();

    // Add key-value pairs
    sortParameter.set("nearest", "startTime");
    sortParameter.set("deadline", "deadline");
    sortParameter.set("capacity", "capacity");
    sortParameter.set("upload-time", "updatedAt");

    const field = sortParameter.get(sortt) ?? "startTime";
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
      success,
      select: sortt,
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
    select: sort,
    user: req.user,
    url: "/history",
  });
});

router.get(
  "/:id",
  checkAuthorization(["ADMIN", "STUDENT"]),
  async (req, res) => {
    const id = req.params.id;
    const success = req.query.success;
    const error = req.query.error;
    const now = new Date();

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).send("Invalid id");

    const [eventDetails, registAll] = await Promise.all([
      Event.findById(id).lean(),
      Registration.find({ eventId: id }).lean(),
    ]);

    const registrationDetails = registAll.find(
      (r) => r.userId.toString() === req.user._id
    );

    const currOcc = registAll.reduce(
      (acc, r) => (r.status === "REGISTERED" ? (acc = acc + 1) : acc),
      0
    );

    if (!eventDetails) return res.status(404).send("No such event exists");

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.render("events/eventDetails", {
      eventDetails,
      registrationDetails,
      role: req.user.role,
      user: req.user,
      currOcc,
      success,
      error,
      now,
    });
  }
);

const redirectWithSuccess = (message, eventId, res) => {
  return res.redirect(
    `/events/${eventId}?success=${encodeURIComponent(message)}`
  );
};
const redirectWithError = (message, eventId, res) => {
  return res.redirect(
    `/events/${eventId}?error=${encodeURIComponent(message)}`
  );
};

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

      // Get event details first
      const event = await Event.findById(eventId).lean();
      if (!event) return res.status(404).send("No such event exists");

      // Check deadline
      if (event.deadline < now) {
        return res.status(400).send("Registration is closed");
      }

      // Check existing registration
      const regist = await Registration.findOne({
        eventId,
        userId,
      }).lean();

      if (regist) {
        if (regist.status === "REGISTERED") {
          return res.status(400).send("Already registered");
        }
        // User previously cancelled, allow re-registration
      }

      // Check capacity
      const totalRegistered = await Registration.countDocuments({
        eventId,
        status: "REGISTERED",
      });

      if (totalRegistered >= event.capacity) {
        return res.status(400).send("Capacity is full");
      }

      // Register
      if (regist && regist.status === "CANCELLED") {
        await registerAgain(eventId, userId, event.deadline);
      } else {
        await registerNew(eventId, userId, event.deadline);
      }

      return redirectWithSuccess("Registered Successfully!", eventId, res);
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
        { $set: { status: "CANCELLED" } },
        { runValidators: true }
      ).lean();

      if (!regist) return res.status(400).send("Invalid request");

      return redirectWithError("Registration Cancelled", eventId, res);
    } catch (err) {
      console.log("Error: ", err.message);
      return res.status(500).render("common/server-error");
    }
  }
);

export default router;
