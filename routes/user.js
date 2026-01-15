import { compare, hash } from "bcrypt";
import express from "express";
import User from "../models/User.js";
import validator from "validator";
import { getUser, setUser } from "../services/auth.js";
const router = express.Router();

// Get Login

router.get("/login", (req, res) => {
  return res.render("user/login", { user: req.user });
});

// Get Signup

router.get("/signup", (req, res) => {
  return res.render("user/signup", { user: req.user });
});

router.get("/logout", (req, res) => {
  res.clearCookie("uid", {
    httpOnly: true,
    sameSite: "strict",
  });
  req.user = null;
  return res.redirect("/user/login");
});

// Post Signup

router.post("/signup", async (req, res) => {
  try {
    const body = req.body;
    if (!body.email || !body.password || !body.fullName) {
      return res.status(400).render("user/signup", {
        body: req.body,
        error: "enter credentials",
        user: req.user,
      });
    }
    if (
      typeof body.email !== "string" ||
      typeof body.fullName !== "string" ||
      typeof body.password !== "string"
    ) {
      return res.status(400).render("user/signup", {
        body: req.body,
        error: "invalid types sent",
        user: req.user,
      });
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password.trim();
    const fullName = body.fullName.trim().toLowerCase();

    if (!validator.isEmail(email)) {
      return res.status(400).render("user/signup", {
        body: req.body,
        error: "invalid email format",
        user: req.user,
      });
    }

    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!regex.test(password))
      return res.status(400).render("user/signup", {
        body: req.body,
        error: "Use 8+ characters with uppercase, lowercase, and a number.",
      });

    if (password.length < 8) {
      return res.status(400).render("user/signup", {
        body: req.body,
        error: "password must be at least 8 characters",
        user: req.user,
      });
    }

    const rounds = 10;
    const hashPassword = await hash(password, rounds);

    await User.create({
      email: email,
      password: hashPassword,
      fullName: fullName,
    });

    return res.status(200).redirect("/user/login");
  } catch (err) {
    if (err?.code === 11000)
      return res.status(409).render("user/signup", {
        body: req.body,
        error: "User already exits",
        user: req.user,
      });
    console.error("signup error:", err);
    return res.status(500).render("user/signup", {
      body: req.body,
      error: "Error while signing up",
      user: req.user,
    });
  }
});

// Post Login

router.post("/login", async (req, res) => {
  try {
    const body = req.body;
    if (!body.email || !body.password)
      return res
        .status(400)
        .render("user/login", { body: req.body, error: "enter credentials" });

    if (typeof body.email !== "string" || typeof body.password !== "string")
      return res
        .status(400)
        .render("user/login", { body: req.body, error: "invalid types sent" });

    const email = body.email.trim().toLowerCase();
    const password = body.password.trim();

    if (!validator.isEmail(email))
      return res.status(400).render("user/login", {
        body: req.body,
        error: "invalid email format",
      });

    if (password.length < 8)
      return res.status(400).render("user/login", {
        body: req.body,
        error: "password must be at least 8 characters",
      });

    const user = await User.findOne({ email });

    if (!user)
      return res
        .status(404)
        .render("user/login", { body: req.body, error: "Account not found" });

    if (!(await compare(password, user.password)))
      return res
        .status(401)
        .render("user/login", { body: req.body, error: "Wrong Password" });

    const payload = { _id: user._id, fullName: user.fullName, role: user.role };

    const token = setUser(payload);
    res.cookie("uid", token, {
      httpOnly: true,
      sameSite: "strict",
    });

    return res.status(200).redirect("/events/discover");
  } catch (err) {
    console.log("Error:", err);
    return res
      .status(500)
      .render("user/login", { body: req.body, error: "login failed" });
  }
});

export default router;
