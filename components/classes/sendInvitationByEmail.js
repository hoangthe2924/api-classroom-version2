const nodemailer = require("nodemailer");

exports.sendInvitation = async (email, classInfo, sender, role) => {
  const link = process.env.FRONT_URL + `/classes/${classInfo.id}?cjc=${classInfo.cjc}`;

  let transporter = nodemailer.createTransport({
    // config mail server
    service: "Gmail",
    auth: {
      user: "botmailer4229@gmail.com",
      pass: process.env.BOTMAILER_PW,
    },
  });
    
  let mailDetails = {
    from: "Classroom BOT",
    to: email,
    subject: `Invitation to classroom ${classInfo.className}`,
    html: `<h3>Hi user,</h3>
    <div>You have an invitation to class ${classInfo.className} as a ${role} from ${sender}!</div>
    <p>Click this link to enroll: ${link}</p>`,
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
