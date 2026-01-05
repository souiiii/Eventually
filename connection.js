import mongoose from "mongoose";

export default async function connectToMongoose(path) {
  return await mongoose.connect(path);
}
