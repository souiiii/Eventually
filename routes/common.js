import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  return res.render("common/homepage", { user: req.user });
});

export default router;
