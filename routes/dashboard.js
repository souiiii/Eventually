import express from "express";
import { checkAuthorization } from "../middlewares/user.js";

const router = express.Router();

router.get("/", (req, res) => {
  return res.redirect("/dashboard/registered");
});

router.get("/cancelled", (req, res) => {
  return res.render("dashboard/cancelled");
});

router.get("/registered", (req, res) => {
  return res.render("dashboard/registered");
});

export default router;
