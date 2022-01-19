const nodemailer = require("nodemailer");
var jwt = require("jsonwebtoken");

exports.sendResetPasswordEmail = (email, link) => {
  var token = jwt.sign({ email: email }, process.env.JWT_SECRET);

  let transporter = nodemailer.createTransport({
    // config mail server
    service: "Gmail",
    auth: {
      user: "botmailer4229@gmail.com",
      pass: process.env.BOTMAILER_PW,
    },
  });

  let mailDetails = {
    from: "Classrum BOT",
    to: email,
    subject: `Password Reset Request for Classrum`,
    html: `<h3>Hi user,</h3>
      <div>Your Classrum password can be reset by using the link below. </div>
      <a href="${link}">${link}</a>
      <p>If you did not request a new password, please ignore this email.</p>`,
  };

  return transporter.sendMail(mailDetails, function (err, info) {
    if (err) {
      console.log("My Error", err);
      return null;
    } else {
      console.log("Email sent: ", info);
      return email;
    }
  });
};
