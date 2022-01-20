const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");


require("dotenv").config();

const passport = require("./middleware/passport");
const indexRouter = require("./routes/index");
// const usersRouter = require("./routes/users");
// const classesRouter = require('./components/classes')
const classesRouter = require("./components/classes/index");
const usersRouter = require("./components/users/index");
const gradesRouter = require("./components/grades/index");
const assignmentRouter = require("./components/assignments/index");
const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(passport.initialize());


app.use("/", indexRouter);
app.use(
  "/classes",
  passport.authenticate("jwt", { session: false }),
  classesRouter
);
app.use("/users", usersRouter);
app.use(
  "/grades",
  passport.authenticate("jwt", { session: false }),
  gradesRouter
);
app.use(
  "/assignments",
  passport.authenticate("jwt", { session: false }),
  assignmentRouter
);

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const db = require("./models");
db.sequelize.sync();

// In development
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });

module.exports = app;
