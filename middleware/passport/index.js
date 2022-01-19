const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const JwtStrategy = require("passport-jwt").Strategy,
  ExtractJwt = require("passport-jwt").ExtractJwt;

const db = require("../../models");
const User = db.user;
const bcrypt = require("bcryptjs");

passport.use(
  new LocalStrategy({ session: false }, async function (
    username,
    password,
    done
  ) {
    const rows = await User.findOne({ where: { username: username } });
    if (!rows) {
      console.log("Database connection error");
      return done(null, false, { message: "Database connection error" });
    } else {
      const checkPass = await bcrypt.compareSync(password, rows.password);
      if (!checkPass) {
        return done(null, false, { message: "Password incorrect" });
      }
    }
    console.log("Succeed");
    if (!rows.status) {
      return done(null, true, { code: -1 });
    }
    else if(rows.status === 2) {
      return done(null, true, { code: 2 });
    }
    return done(null, true, { code: 1 });
  })
);

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET;

passport.use(
  new JwtStrategy(opts, async function (jwt_payload, done) {
    const user = await User.scope("withoutPassword").findOne({
      where: { username: jwt_payload.username },
    });
    // console.log(user);
    return done(null, user);
  })
);

module.exports = passport;
