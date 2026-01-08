import { getUser } from "../services/auth.js";
import User from "../models/User.js";
import mongoose from "mongoose";

export function checkAuth(req, res, next) {
  try {
    req.user = null;
    const token = req.cookies?.uid;
    if (!token) return next();
    if (typeof token !== "string") throw new Error("Incorrect token type");
    const user = getUser(token);
    if (typeof user !== "object") throw new Error("Invalid User");
    req.user = user;
    return next();
  } catch (err) {
    console.log("Error: Malicious Login Tried. ", err.message);
    return res.status(400).redirect("/user/login");
  }
}

export function checkAuthorization(roles) {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(400).redirect("/user/login");
      if (typeof req.user !== "object") throw new Error("Invalid User");
      const user = req.user;
      if (
        !user._id ||
        typeof user._id !== "string" ||
        !user.fullName ||
        typeof user.fullName !== "string" ||
        !user.role ||
        typeof user.role !== "string"
      )
        throw new Error("Invalid User");

      if (!mongoose.Types.ObjectId.isValid(user._id))
        throw new Error("Invalid User");

      const validUser = await User.findById(user._id);
      if (!validUser) throw new Error("Invalid User");
      if (!roles.includes(user.role))
        return res.status(403).send("Unauthorized Access");

      return next();
    } catch (err) {
      console.log(err.message);
      return res.redirect("/user/login");
    }
  };
}
