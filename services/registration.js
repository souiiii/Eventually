import crypto from "crypto";
import Registration from "../models/Registration.js";

export function generateCode(length) {
  let result = "";

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    result = result + chars[bytes[i] % chars.length];
  }

  return result;
}

export async function registerAgain(eventId, userId, deadline) {
  for (let i = 0; i < 10; i++) {
    try {
      const now = new Date();
      if (deadline < now) {
        throw new Error("Registration is closed");
      }

      const code = generateCode(9);
      const registration = await Registration.findOneAndUpdate(
        { eventId, userId, status: "CANCELLED" },
        { $set: { status: "REGISTERED", registrationCode: code } },
        { runValidators: true }
      );
      return;
    } catch (err) {
      console.log("Code generation failed - Try " + (i + 1));
      if (err?.code === 11000) continue;
      throw err;
    }
  }
  throw new Error("Registration failed");
}

export async function registerNew(eventId, userId, deadline) {
  for (let i = 0; i < 10; i++) {
    try {
      const now = new Date();
      if (deadline < now) {
        throw new Error("Registration closed");
      }

      const code = generateCode(9);
      await Registration.create({
        eventId,
        userId,
        status: "REGISTERED",
        attendanceStatus: "PENDING",
        registrationCode: code,
      });

      return;
    } catch (err) {
      console.log("Code generation failed - Try " + (i + 1));
      if (err?.code === 11000) {
        if (err.keyPattern?.userId && err.keyPattern?.eventId) {
          throw new Error("Already registered");
        }
        continue;
      }
      throw err;
    }
  }
  throw new Error("Registration failed");
}
