import express from "express";
import { checkAuthorization } from "../middlewares/user.js";

const router = express.Router();

router.get("/", (req, res) => {
  return res.redirect("/events/discover");
});

router.get(
  "/discover",
  checkAuthorization(["ADMIN", "STUDENT"]),
  (req, res) => {
    return res.render("events/upcoming");
  }
);

router.get("/history", checkAuthorization(["ADMIN"]), (req, res) => {
  return res.render("events/past");
});

router.get("/:id", checkAuthorization(["ADMIN", "STUDENT"]), (req, res) => {
  return res.render("events/eventDetails");
});

export default router;
