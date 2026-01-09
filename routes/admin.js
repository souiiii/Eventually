import express from "express";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import mongoose from "mongoose";
import validator from "validator";

const router = express.Router();

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
      !body.endTime
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
        startTime: event.startTime.toISOString().slice(0, 16),
        endTime: event.endTime.toISOString().slice(0, 16),
        deadline: event.deadline.toISOString().slice(0, 16),
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
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send("bad request");
    }

    const eventRegistrations = await Registration.find({
      eventId: id,
      status: "REGISTERED",
    }).populate("userId", "fullName email");

    return res.status(200).render("admin/eventRegistrations", {
      eventRegistrations,
      user: req.user,
    });
  } catch (err) {
    console.log("Error: ", err.message);
    return res.status(500).render("common/server-error");
  }
});

router.post("/mark-attendance/:registrationId_eventId", async (req, res) => {
  try {
    const ids = req.params.registrationId_eventId.trim();
    const parts = ids.split("_");
    if (parts.length !== 2) return res.status(400).send("Invalid Id");

    const [registrationId, eventId] = parts;
    const code = req.body.code?.trim().toUpperCase();
    const now = new Date();

    if (
      !registrationId ||
      !eventId ||
      !mongoose.Types.ObjectId.isValid(registrationId) ||
      !mongoose.Types.ObjectId.isValid(eventId)
    ) {
      return res.status(400).send("Invalid Id");
    }

    const event = await Event.findById(eventId, "startTime endTime").lean();
    if (!event) return res.status(404).send("No such event found");

    if (event.startTime > now || event.endTime < now)
      return res.status(400).send("Event is not live");

    if (!code) return res.status(400).send("Enter code before submitting");

    if (!(code.length === 9)) return res.status(400).send("Enter valid code");

    const registration = await Registration.findOneAndUpdate(
      {
        _id: registrationId,
        attendanceStatus: "PENDING",
        status: "REGISTERED",
        eventId,
        registrationCode: code,
      },
      { $set: { attendanceStatus: "ATTENDED" } },
      { runValidators: true, new: true }
    );

    if (!registration)
      return res.status(400).send("Invalid Request - Can't mark attendance");

    return res.redirect(`/admin/student-registrations/${eventId}`);
  } catch (err) {
    console.log("Error: ", err.message);
    if (err?.code === 11000)
      console.log("Database error encountered, cannot write");
    return res.status(500).render("common/server-error");
  }
});

export default router;
