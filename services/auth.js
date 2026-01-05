import jwt from "jsonwebtoken";

export function setUser(payload) {
  if (!payload) throw new Error("No payload sent");
  if (typeof payload !== "object") throw new Error("Invalid Payload");

  const secret = process.env.secretKey;
  if (!secret) throw new Error("No jwt key found");
  const token = jwt.sign(payload, secret, {
    expiresIn: "1d",
  });
  return token;
}

export function getUser(token) {
  const secret = process.env.secretKey;
  if (!secret) throw new Error("No jwt key found");
  const user = jwt.verify(token, secret);
  return user;
}
