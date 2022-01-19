const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();
const users = require("./user.controller");
const passport = require("../../middleware/passport/index");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const db = require("../../models");
const User = db.user;

router.get("/", passport.authenticate("jwt", { session: false }), (req, res) =>
  users.findAll(req, res)
);

router.get(
  "/admins",
  passport.authenticate("jwt", { session: false }),
  (req, res) => users.findAllAdmins(req, res)
);

/* POST login */
router.post(
  "/login",
  passport.authenticate("local", { session: false }),
  function (req, res, next) {
    console.log(req.authInfo.code)
    if (req.authInfo.code === -1) {
      return res.status(403).send({ message: "Your account has been banned!" });
    }
    else if (req.authInfo.code === 2) {
      return res.status(412).send({ message: "Your account has not been activated!" });
    }
    console.log("login success");
    const token = jwt.sign(
      { username: req.body.username },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    return res.status(200).send({
      accessToken: token,
    });
  }
);

/* POST register */
router.post("/register", (req, res, next) => users.create(req, res));

router.post("/forgot-password", (req, res, next) =>
  users.requestResetPassword(req, res)
);

router.post("/reset-password/:userId/:token", (req, res, next) =>
  users.resetPassword(req, res)
);

router.post(
  "/addAdmin",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => users.addAdmin(req, res)
);

router.get("/confirm/:token", (req, res, next) => {
  users.confirmRegistration(req, res)
});


/* Protected domain */
router.get(
  "/info",
  passport.authenticate("jwt", { session: false }),
  function (req, res, next) {
    const userInfo = req.user;
    console.log("ui", JSON.stringify(userInfo));
    return res.status(200).send(userInfo);
  }
);

router.post("/google/login", async (req, res) => {
  const { token } = req.body;
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { name, email } = ticket.getPayload();
  console.log(name);
  // findOrCreate
  const [user, created] = await User.findOrCreate({
    where: { email: email },
    defaults: {
      email: email,
      fullname: name,
      username: email,
    },
  });
  if (created) {
    console.log(user); // This will certainly be 'Technical Lead JavaScript'
  }
  const serverToken = jwt.sign(
    { username: user.username },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  return res.status(200).send({
    accessToken: serverToken,
  });
});

router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => users.findOne(req, res)
);

router.put(
  "/info",
  passport.authenticate("jwt", { session: false }),
  (req, res) => users.update(req, res)
);

router.put(
  "/banUser",
  passport.authenticate("jwt", { session: false }),
  (req, res) => users.banUser(req, res)
);

module.exports = router;
