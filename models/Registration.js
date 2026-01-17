import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "user",
    },
    eventId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "event",
    },
    registrationCode: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["REGISTERED", "CANCELLED"],
      default: "REGISTERED",
    },
    attendanceStatus: {
      type: String,
      required: true,
      enum: ["PENDING", "ATTENDED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });
registrationSchema.index({ eventId: 1, status: 1 });
registrationSchema.index({ userId: 1, status: 1 });
registrationSchema.index({ eventId: 1, attendanceStatus: 1 });
registrationSchema.index({ registrationCode: 1, eventId: 1 }, { unique: true });

const registrationModel = mongoose.model("registrations", registrationSchema);

export default registrationModel;
