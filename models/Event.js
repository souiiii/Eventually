import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    organiser: {
      type: String,
      required: true,
    },
    venue: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    deadline: {
      type: Date,
      required: true,
      default: function () {
        return this.startTime;
      },
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    author: {
      type: String,
      required: true,
      default: "Dr Lipika Das",
    },
    position: {
      type: String,
      required: true,
      default: "Chair, HRDC",
    },
  },
  { timestamps: true }
);

const eventModel = mongoose.model("event", eventSchema);

export default eventModel;
