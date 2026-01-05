import dotenv from "dotenv";
dotenv.config();
import express, { json, urlencoded } from "express";
import connectToMongoose from "./connection.js";

import cookieParser from "cookie-parser";
const app = express();
const PORT = process.env.PORT ?? 8000;
const mongoPath = process.env.mongodbUrl;

app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());

connectToMongoose(mongoPath)
  .then(() => {
    console.log("database connected");
    app.listen(PORT, () => console.log("server started"));
  })
  .catch((err) => {
    console.error("error connecting to database", err);
    process.exit(1);
  });
