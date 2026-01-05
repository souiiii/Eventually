import express from "express";

const router = express.Router();

router.get("/discover", (req, res) => {
  return res.render("events/upcoming");
});

export default router;
