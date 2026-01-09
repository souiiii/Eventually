import dotenv from "dotenv";
dotenv.config();
import express, { json, urlencoded } from "express";
import path from "path";
import commonRouter from "./routes/common.js";
import userRouter from "./routes/user.js";
import eventRouter from "./routes/events.js";
import dashboardRouter from "./routes/dashboard.js";
import adminRouter from "./routes/admin.js";
import connectToMongoose from "./connection.js";
import cookieParser from "cookie-parser";
import { checkAuth, checkAuthorization } from "./middlewares/user.js";

const app = express();
const PORT = process.env.PORT ?? 8000;
const mongoPath = process.env.mongodbUrl;

app.set("view engine", "ejs");
app.set("views", path.resolve("views"));

app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(checkAuth);

app.use("/", commonRouter);
app.use("/user", userRouter);
app.use("/events", eventRouter);
app.use("/dashboard", checkAuthorization(["STUDENT"]), dashboardRouter);
app.use("/admin", checkAuthorization(["ADMIN"]), adminRouter);

connectToMongoose(mongoPath)
  .then(() => {
    console.log("database connected");
    app.listen(PORT, () => console.log("server started"));
  })
  .catch((err) => {
    console.error("error connecting to database", err);
    process.exit(1);
  });
