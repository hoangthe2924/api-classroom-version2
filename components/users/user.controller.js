const db = require("../../models");
const User = db.user;
const Class = db.class;
const Op = db.Sequelize.Op;
const bcrypt = require("bcryptjs");
const emailer = require("./sendConfirmationEmail");
const crypto = require("crypto");
const { sendResetPasswordEmail } = require("./sendResetPasswordEmail");
const ResetPasswordToken = db.resetPasswordToken;
var jwt = require("jsonwebtoken");

// Create and Save a new User
exports.create = async (req, res) => {
  // Validate request
  if (!req.body.username || !req.body.password || !req.body.email) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }
  const hash = bcrypt.hashSync(req.body.password, 10);

  const mailExisted = await User.findOne({
    where: { email: req.body.email },
  });
  if (mailExisted) return res.status(400).send("Email already existed!");

  const usernameExisted = await User.findOne({
    where: { username: req.body.username },
  });
  if (usernameExisted) return res.status(400).send("Username already existed!");

  const newUser = {
    username: req.body.username,
    email: req.body.email,
    password: hash,
    fullname: req.body.fullname,
    studentId: req.body.studentId,
    status: 2,
  };

  // Save User in the database
  User.create(newUser)
    .then((data) => {
      emailer.sendConfirmation(req.body.email);
      res.status(200).send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      });
    });
};

exports.confirmRegistration = async (req, res) => {
  const token = req.params.token;
  try {
    const jwtdecode = jwt.verify(token, process.env.JWT_SECRET);
    if (!jwtdecode) {
      return res.status(400).send({ message: "Invalid token!" });
    }
    const user = await User.findOne({
      where: { email: jwtdecode.email },
    });
    if (!user) {
      return res.status(404).send({ message: "Invalid token!" });
    }
    user.update({ status: 1 });
    return res.status(200).send({
      message: "Your account has been activated!",
    });
  } catch (error) {
    res.status(500).send({ message: "Your link is invalid!" });
  }
};

exports.requestResetPassword = async (req, res) => {
  // Validate request
  if (!req.body.email) {
    return res.status(400).send({
      message: "Content can not be empty!",
    });
  }

  const user = await User.findOne({
    where: { email: req.body.email },
  });
  if (!user) return res.status(400).send("Invalid email!");
  ResetPasswordToken.findOne({
    where: { userId: user.id },
  })
    .then(async (tokenExisted) => {
      if (!tokenExisted) {
        console.log("Create token");
        tokenExisted = await ResetPasswordToken.create({
          userId: user.id,
          token: crypto.randomBytes(32).toString("hex"),
        });
      }
      const link =
        process.env.FRONT_URL +
        `/password-reset/${user.id}/${tokenExisted.token}`;
      const mailSent = sendResetPasswordEmail(req.body.email, link);
      console.log("mailsent", mailSent);
      res.send("Password reset link sent to your email address");
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred in password reset!",
      });
    });
};

exports.resetPassword = async (req, res) => {
  // Validate request
  if (!req.body.password) {
    return res.status(400).send({
      message: "Content can not be empty!",
    });
  }

  const user = await User.findByPk(req.params.userId);
  if (!user) return res.status(400).send("Invalid link or expired");

  const tokenExisted = await ResetPasswordToken.findOne({
    where: { userId: req.params.userId, token: req.params.token },
  });
  if (!tokenExisted) return res.status(400).send("Invalid link or expired");

  user.update({ password: bcrypt.hashSync(req.body.password, 10) });
  await tokenExisted.destroy();

  res.send("Password reset sucessfully.");
};

exports.addAdmin = (req, res) => {
  // Validate request
  if (
    !req.body.username ||
    !req.body.password ||
    !req.body.email ||
    !req.body.fullname
  ) {
    res.status(400).send({
      message: "Content can not be empty!",
    });
    return;
  }
  const hash = bcrypt.hashSync(req.body.password, 10);

  const newUser = {
    username: req.body.username,
    fullname: req.body.fullname,
    email: req.body.email,
    password: hash,
    isAdmin: true,
  };

  // Save User in the database
  User.create(newUser)
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      });
    });
};

// Retrieve all Users from the database.
exports.findAll = (req, res) => {
  if (!req.user.isAdmin) {
    res.status(403).send("You don't have permission!");
  }
  User.scope("withoutPassword")
    .findAll()
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users.",
      });
    });
};

exports.findAllAdmins = (req, res) => {
  if (!req.user.isAdmin) {
    res.status(403).send("You don't have permission!");
  }
  User.scope("withoutPassword")
    .findAll({
      where: { isAdmin: true },
    })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while retrieving users.",
      });
    });
};

exports.findOne = (req, res) => {
  const id = req.params.id;
  if (!req.user.isAdmin) {
    res.status(403).send("You don't have permission!");
  }
  User.scope("withoutPassword")
    .findByPk(id, {
      include: [
        {
          model: Class,
          as: "classes",
          attributes: ["id", "classname", "subject", "createdAt"],
          through: {
            attributes: [],
          },
          order: [["createdAt", "DESC"]],
        },
      ],
    })
    .then((data) => {
      if (data) {
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find User with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving User with id=" + id,
      });
    });
};

exports.update = async (req, res) => {
  const userRequest = req.user;
  const updateUser = {
    fullname: req.body.fullname,
    studentId: req.body.studentId || null,
  };
  console.log("reqbod", req.body);
  if (userRequest.id !== req.body.id && !userRequest.isAdmin) {
    res.status(403).send("You don't have permission!");
  }
  const existingStudentId = await User.findOne({
    where: { studentId: req.body.studentId },
  });

  if (existingStudentId && existingStudentId.id !== req.body.id) {
    console.log("existed");
    res
      .status(499)
      .send("Student Id " + existingStudentId.studentId + " already existed!");
    return;
  }

  User.findOne({
    where: { id: req.body.id },
    attributes: { exclude: ["password"] },
  })
    .then((member) => {
      console.log("mem", member);
      if (!member) {
        console.log("Member not found!");
        res
          .status(500)
          .send("Error retrieving Member with studentId=" + member.studentId);
        return;
      }
      if (!member.studentId || member.studentId === "") {
        member.update(updateUser);
      } else {
        if (userRequest.isAdmin) {
          member.update(updateUser);
        } else {
          member.update({ fullname: req.body.fullname });
        }
      }
      res.send(member);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      });
    });
};

exports.banUser = async (req, res) => {
  const isAdmin = req.user.isAdmin;

  if (!isAdmin) {
    res.status(403).send("You don't have permission!");
  }

  User.findOne({
    where: { id: req.body.id },
    attributes: { exclude: ["password"] },
  })
    .then((member) => {
      if (!member) {
        console.log("Member not found!");
        res
          .status(404)
          .send("Error retrieving Member with studentId=" + member.studentId);
        return;
      }
      member.update({ status: !member.status });
      res.send(member);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the User.",
      });
    });
};
