import express from "express";
import Registration from "../models/Registration.js";

const router = express.Router();

router.get("/", (req, res) => {
  return res.redirect("/dashboard/registered");
});

router.get("/cancelled", async (req, res) => {
  const now = new Date();

  const { sort = "recent" } = req.query;

  const sortParameter = new Map();

  sortParameter.set("recent", ["updatedAt", "desc"]);
  sortParameter.set("oldest", ["updatedAt", "asc"]);

  const [field, dirText] = sortParameter.get(sort) ?? ["updatedAt", "desc"];
  const direction = dirText === "desc" ? -1 : 1;
  const sortObject = { [field]: direction };

  const cancelledEvents = (
    await Registration.find({
      userId: req.user._id,
      status: "CANCELLED",
    })
      .populate({
        path: "eventId",
        select: "_id startTime endTime title shortDescription",
      })
      .sort(sortObject)
      .lean()
  ).filter((r) => r.eventId);

  return res.render("dashboard/cancelled", {
    cancelledEvents,
    now,
    user: req.user,
  });
});

router.get("/registered", async (req, res) => {
  const now = new Date();
  const { sort = "recent" } = req.query;

  const sortParameter = new Map([
    ["recent", ["updatedAt", "desc"]],
    ["oldest", ["updatedAt", "asc"]],
  ]);

  const [field, dirText] = sortParameter.get(sort) ?? ["updatedAt", "desc"];
  const direction = dirText === "desc" ? -1 : 1;

  const baseSortObject = { [field]: direction };

  const registeredEvents = (
    await Registration.find({
      userId: req.user._id,
      status: "REGISTERED",
    })
      .populate({
        path: "eventId",
        select: "_id startTime endTime title shortDescription",
      })
      .sort(baseSortObject)
      .lean()
  )
    .filter((r) => r.eventId)
    .sort((a, b) => {
      if (sort === "recent") {
        const aLive =
          a.eventId.startTime <= now && a.eventId.endTime >= now ? 0 : 1;
        const bLive =
          b.eventId.startTime <= now && b.eventId.endTime >= now ? 0 : 1;
        if (aLive !== bLive) return aLive - bLive;
      }

      const av = new Date(a[field]).getTime();
      const bv = new Date(b[field]).getTime();
      return direction * (av - bv);
    });

  return res.render("dashboard/registered", {
    registeredEvents,
    now,
    user: req.user,
  });
});

export default router;
