import express from "express";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import mongoose from "mongoose";
import validator from "validator";
import { redirectWithError, redirectWithSuccess } from "../services/message.js";

const router = express.Router();

const toDatetimeLocalUTC = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
};

router.get("/create-event", (req, res) => {
  return res.render("admin/addEvent", { user: req.user });
});

router.post("/create-event", async (req, res) => {
  try {
    const body = req.body;
    if (
      !body.title ||
      !body.shortDescription ||
      !body.description ||
      !body.organiser ||
      !body.venue ||
      !body.capacity ||
      !body.deadline ||
      !body.startTime ||
      !body.endTime ||
      !body.author ||
      !body.position
    )
      return res.status(400).render("admin/addEvent", {
        error: "Field data missing",
        user: req.user,
      });
    if (
      typeof body.title !== "string" ||
      typeof body.shortDescription !== "string" ||
      typeof body.description !== "string" ||
      typeof body.organiser !== "string" ||
      typeof body.venue !== "string" ||
      typeof body.capacity !== "string" ||
      typeof body.deadline !== "string" ||
      typeof body.startTime !== "string" ||
      typeof body.endTime !== "string" ||
      typeof body.author !== "string" ||
      typeof body.position !== "string" ||
      !validator.isISO8601(body.deadline, {
        strict: false,
        strictSeparator: true,
      }) ||
      !validator.isISO8601(body.startTime, {
        strict: false,
        strictSeparator: true,
      }) ||
      !validator.isISO8601(body.endTime, {
        strict: false,
        strictSeparator: true,
      })
    )
      return res.status(400).render("admin/addEvent", {
        error: "Invalid data sent",
        user: req.user,
      });

    const title = body.title.trim();
    const shortDescription = body.shortDescription.trim();
    const description = body.description.trim();
    const organiser = body.organiser.trim();
    const position = body.position.trim();
    const author = body.author.trim();
    const capacity = Number(body.capacity.trim());
    const venue = body.venue.trim();
    const deadline = new Date(body.deadline.trim());
    const startTime = new Date(body.startTime.trim());
    const endTime = new Date(body.endTime.trim());

    if (!Number.isInteger(capacity) || capacity <= 0) {
      return res.status(400).render("admin/addEvent", {
        error: "Invalid capacity",
        user: req.user,
      });
    }

    const now = new Date();
    if (
      [startTime, endTime, deadline].some(
        (d) => Number.isNaN(d.getTime()) || d < now
      )
    )
      return res.status(400).render("admin/addEvent", {
        error: "Invalid date sent",
        user: req.user,
      });

    if (startTime >= endTime) {
      return res.status(400).render("admin/addEvent", {
        error: "Start time must be before End Time",
        user: req.user,
      });
    }
    if (startTime < deadline) {
      return res.status(400).render("admin/addEvent", {
        error: "Deadline must be before Start Time",
        user: req.user,
      });
    }

    await Event.create({
      title,
      shortDescription,
      description,
      organiser,
      capacity,
      venue,
      deadline,
      startTime,
      endTime,
      position,
      author,
    });

    return res.redirect("/events");
  } catch (err) {
    console.log("Error: ", err.message);
    return res.status(500).render("common/server-error");
  }
});

router.get("/edit-event/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("bad request");
    }

    let event = await Event.findById(id);
    event = event.toObject();
    if (!event) return res.status(404).send("Bad request");

    return res.render("admin/editEvent", {
      event: {
        ...event,
        startTime: toDatetimeLocalUTC(event.startTime),
        endTime: toDatetimeLocalUTC(event.endTime),
        deadline: toDatetimeLocalUTC(event.deadline),
      },
      user: req.user,
    });
  } catch (err) {
    console.log("Error: ", err.message);
    return res.status(500).render("common/server-error");
  }
});

router.post("/edit-event/:id", async (req, res) => {
  try {
    const body = req.body;
    const id = req.params.id;

    if (!id) return res.status(400).send("No id passed");
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).send("bad request");

    let event = await Event.findById(id);
    if (!event) return res.status(400).send("bad request");

    event = event.toObject();

    const fmt = (d) => d.toISOString().slice(0, 16);
    const baseEventForView = {
      ...event,
      startTime: fmt(event.startTime),
      endTime: fmt(event.endTime),
      deadline: fmt(event.deadline),
    };

    const renderEdit = (message) =>
      res.status(400).render("admin/editEvent", {
        event: baseEventForView,
        error: message,
        user: req.user,
      });

    const now = Date.now();

    if (now >= event.startTime)
      return res.status(400).send("event already commenced");

    if (
      !body.title ||
      !body.shortDescription ||
      !body.description ||
      !body.organiser ||
      !body.venue ||
      !body.capacity ||
      !body.deadline ||
      !body.startTime ||
      !body.author ||
      !body.position ||
      !body.endTime
    ) {
      return renderEdit("Field data missing");
    }

    if (
      typeof body.title !== "string" ||
      typeof body.shortDescription !== "string" ||
      typeof body.description !== "string" ||
      typeof body.organiser !== "string" ||
      typeof body.venue !== "string" ||
      typeof body.capacity !== "string" ||
      typeof body.deadline !== "string" ||
      typeof body.startTime !== "string" ||
      typeof body.endTime !== "string" ||
      typeof body.position !== "string" ||
      typeof body.author !== "string" ||
      !validator.isISO8601(body.deadline, {
        strict: false,
        strictSeparator: true,
      }) ||
      !validator.isISO8601(body.startTime, {
        strict: false,
        strictSeparator: true,
      }) ||
      !validator.isISO8601(body.endTime, {
        strict: false,
        strictSeparator: true,
      })
    ) {
      return renderEdit("Invalid data sent");
    }

    const title = body.title.trim();
    const shortDescription = body.shortDescription.trim();
    const description = body.description.trim();
    const organiser = body.organiser.trim();
    const position = body.position.trim();
    const author = body.author.trim();
    const capacity = Number(body.capacity.trim());
    const venue = body.venue.trim();
    const deadline = new Date(body.deadline.trim());
    const startTime = new Date(body.startTime.trim());
    const endTime = new Date(body.endTime.trim());

    if (!Number.isInteger(capacity) || capacity <= 0) {
      return renderEdit("Invalid capacity");
    }

    if (
      [startTime, endTime, deadline].some(
        (d) => Number.isNaN(d.getTime()) || d < now
      )
    ) {
      return renderEdit("Invalid date sent");
    }

    if (startTime >= endTime) {
      return renderEdit("Start time must be before End Time");
    }

    if (startTime < deadline) {
      return renderEdit("Deadline must be before Start Time");
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        $set: {
          title,
          shortDescription,
          description,
          organiser,
          capacity,
          author,
          position,
          venue,
          deadline,
          startTime,
          endTime,
        },
      },
      { runValidators: true, new: true }
    );

    if (!updatedEvent) return res.status(404).send("id not found");

    return res.redirect("/events");
  } catch (err) {
    console.log("Error: ", err.message);
    if (err?.code === 11000) return res.status(400).send("bad request");
    return res.status(500).render("common/server-error");
  }
});

router.delete("/delete-event/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("bad request");
    }

    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).send("id not found");
    }

    await Registration.deleteMany({
      eventId: id,
    });

    return res.redirect("/events");
  } catch (err) {
    console.log("Error: ", err.message);
    return res.status(500).render("common/server-error");
  }
});

router.get("/student-registrations/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const error = req.query.error;
    const success = req.query.success;
    const now = new Date();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("bad request");
    }

    const eventRegistrations = await Registration.find({
      eventId: id,
      status: "REGISTERED",
    })
      .populate("userId", "fullName email")
      .populate("eventId")
      .lean();

    let eventDetails = null;

    if (!eventRegistrations.length) {
      eventDetails = await Event.findById(id);
      if (!eventDetails) return res.status(400).send("Invalid Event Id");
    } else {
      eventDetails = eventRegistrations.find(
        (r) => r.eventId._id.toString() === id
      ).eventId;
    }

    return res.status(200).render("admin/eventRegistrations", {
      eventRegistrations,
      eventDetails,
      user: req.user,
      now,
      success,
      error,
    });
  } catch (err) {
    console.log("Error: ", err.message);
    return res.status(500).render("common/server-error");
  }
});

router.post("/mark-attendance/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;

    const code = req.body.code?.trim().toUpperCase();
    const now = new Date();

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).send("Invalid Id");
    }

    const event = await Event.findById(eventId, "startTime endTime").lean();
    if (!event) return res.status(404).send("No such event found");

    if (event.startTime > now || event.endTime < now)
      return redirectWithError("Event is not live", res, eventId);

    if (!code) return redirectWithError("Please enter a code", res, eventId);

    if (!(code.length === 11))
      return redirectWithError("Enter valid code", res, eventId);

    let unformattedCodeSprite = code.split("-");
    if (unformattedCodeSprite.length !== 3)
      return redirectWithError(
        "Invalid code format (Use XXX-XXX-XXX)",
        res,
        eventId
      );
    const finalCode =
      unformattedCodeSprite[0] +
      unformattedCodeSprite[1] +
      unformattedCodeSprite[2];

    const registration = await Registration.findOneAndUpdate(
      {
        attendanceStatus: "PENDING",
        status: "REGISTERED",
        eventId,
        registrationCode: finalCode,
      },
      { $set: { attendanceStatus: "ATTENDED" } },
      { runValidators: true, new: true }
    ).populate("userId", "_id fullName");

    if (!registration)
      return redirectWithError(
        "Invalid Code or Student already marked present",
        res,
        eventId
      );

    return redirectWithSuccess(
      `Attendance marked for ${
        registration.userId.fullName.slice(0, 1).toUpperCase() +
        registration.userId.fullName.slice(1)
      }`,
      res,
      eventId
    );
  } catch (err) {
    console.log("Error: ", err.message);
    if (err?.code === 11000)
      console.log("Database error encountered, cannot write");
    return res.status(500).render("common/server-error");
  }
});

export default router;
