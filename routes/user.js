import { compare, hash } from "bcrypt";
import express from "express";
import User from "../models/User.js";
import validator from "validator";
import { getUser, setUser } from "../services/auth.js";
const router = express.Router();

// Get Login

router.get("/login", (req, res) => {
  return res.render("user/login");
});

// Get Signup

router.get("/signup", (req, res) => {
  return res.render("user/signup");
});

// Post Signup

router.post("/signup", async (req, res) => {
  try {
    const body = req.body;
    if (!body.email || !body.password || !body.fullName) {
      return res
        .status(400)
        .render("user/signup", { error: "enter credentials" });
    }
    if (
      typeof body.email !== "string" ||
      typeof body.fullName !== "string" ||
      typeof body.password !== "string"
    ) {
      return res
        .status(400)
        .render("user/signup", { error: "invalid types sent" });
    }

    const email = body.email.trim().toLowerCase();
    const password = body.password.trim();
    const fullName = body.fullName.trim().toLowerCase();

    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .render("user/signup", { error: "invalid email format" });
    }

    if (password.length < 8) {
      return res.status(400).render("user/signup", {
        error: "password must be at least 8 characters",
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
      return res
        .status(409)
        .render("user/signup", { error: "User already exits" });
    console.error("signup error:", err);
    return res
      .status(500)
      .render("user/signup", { error: "Error while signing up" });
  }
});

// Post Login

router.post("/login", async (req, res) => {
  try {
    const body = req.body;
    if (!body.email || !body.password)
      return res
        .status(400)
        .render("user/login", { error: "enter credentials" });

    if (typeof body.email !== "string" || typeof body.password !== "string")
      return res
        .status(400)
        .render("user/login", { error: "invalid types sent" });

    const email = body.email.trim().toLowerCase();
    const password = body.password.trim();

    if (!validator.isEmail(email))
      return res
        .status(400)
        .render("user/login", { error: "invalid email format" });

    if (password.length < 8)
      return res.status(400).render("user/login", {
        error: "password must be at least 8 characters",
      });

    const user = await User.findOne({ email });

    if (!user)
      return res
        .status(404)
        .render("user/login", { error: "Account not found" });

    if (!(await compare(password, user.password)))
      return res.status(401).render("user/login", { error: "Wrong Password" });

    const payload = { _id: user._id, fullName: user.fullName, role: user.role };

    const token = setUser(payload);
    res.cookie("uid", token, {
      httpOnly: true,
      sameSite: "strict",
    });

    return res.status(200).render("user/login");
  } catch (err) {
    console.log("Error:", err);
    return res.status(500).render("user/login", { error: "login failed" });
  }
});

export default router;
