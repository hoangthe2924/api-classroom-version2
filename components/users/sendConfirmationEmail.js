
const nodemailer = require("nodemailer");
var jwt = require('jsonwebtoken');

exports.sendConfirmation = async (email) => {
    var token = jwt.sign(
        { email: email },
        process.env.JWT_SECRET);

    const link = process.env.FRONT_URL + `/confirm/${token}`;
  
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
      subject: `Confirmation on registering at Classrum`,
      html: `<h3>Hi user,</h3>
      <div>We have received a request to register an account at our Classrum platform.</div>
      <p>Please click this link to confirm your registration: ${link}</p>`,
    };
  
    return await transporter.sendMail(mailDetails, function (err, info) {
      if (err) {
        console.log('My Error',err);
        return null;
      } else {
        console.log('Email sent: ', info);
        return email;
      }
    });
  };
  