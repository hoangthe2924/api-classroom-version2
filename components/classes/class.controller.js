const db = require("../../models");
const Class = db.class;
const User = db.user;
const Assignment = db.assignment;
const Op = db.Sequelize.Op;
const classService = require("./class.service");
const emailTransport = require("./sendInvitationByEmail");

const sendListInvitation = async (listEmail, classInfo, sender, role) => {
  const sendedEmailList = [];
  for (const email of listEmail) {
    const hasEnrolled = await classService.checkAlreadyEnrollment(
      email,
      classInfo.id
    );
    if (hasEnrolled) {
      continue;
    }

    //Gui mail cho nhung ai chua enroll
    const res = emailTransport.sendInvitation(email, classInfo, sender, role); //lay thong tin nguoi gui tu token
    if (res) {
      sendedEmailList.push(email);
      //Kiem tra neu ho co tai khoan, add vo luon lop hoc
      const accountID = await classService.getAccountIDByEmail(email);
      if (accountID > 0) {
        classService.addUserToClass(accountID, classInfo.id, role);
      }
    }
  }

  return sendedEmailList;
};

exports.invitePeople = async function (req, res) {
  const listEmail = req.body.listEmail;
  const classID = req.body.classID;
  const role = req.body.role.trim().toLowerCase();
  const user = req.user;
  let result = false;

  const classInfo = await classService.getClassInfoByID(classID);
  if (!classInfo) {
    res.status(500).json({ message: "Cannot get the class ID!" });
  }
  const sendedEmailList = await sendListInvitation(
    listEmail,
    classInfo,
    user.username,
    role
  );

  if (role === "teacher") {
    result = await classService.addToTeacherWaitingRoom(
      classID,
      sendedEmailList
    );
    if (!result) {
      res.status(404).json({ message: "error" });
    }
  } else if (role === "student") {
    //do nothing
  }

  res.status(201).json({ message: "Invitation has been sent successfully!" });
};

// Create and Save a new Class
exports.createNewClass = async (req, res) => {
  // Validate request
  if (!req.body.className) {
    res.status(400).send({
      message: "Content cannot be empty!",
    });
    return;
  }

  //console.log("curUser", req.user);
  const currentUserId = req.user.id;
  if (!currentUserId) {
    res.status(400).send({
      message: "Have you logged in yet?!",
    });
  }
  const owner = await User.findByPk(currentUserId);
  if (!owner) {
    res.status(400).send({
      message: "You don't have permission!",
    });
    return;
  }

  const cjc = Math.random().toString(36).substring(2, 7);

  const myClass = {
    className: req.body.className,
    subject: req.body.subject,
    description: req.body.description,
    cjc: cjc,
  };

  // Save Class in the database
  const createdClass = await Class.create(myClass);
  // .then((data) => {
  //   console.log("created", data);
  //   res.send(data);
  // })
  // .catch((err) => {
  //   res.status(500).send({
  //     message: err.message || "Some error occurred while creating the Class.",
  //   });
  // });
  createdClass.setOwner(owner);
  // Owner is teacher
  createdClass.addUser(owner, { through: { role: "teacher" } });

  createdClass
    .save()
    .then((data) => {
      //console.log("created", data);
      res.send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating the Class.",
      });
    });
};

// Retrieve all Classes from the database.
// Check token of current user from header -> get all classes of user
exports.getListClass = async (req, res) => {
  const user = req.user;
  const result = await classService.getClassList(user);

  res.status(result.status).json(result.message);
};

// Get class detail
exports.getClassDetail = async (req, res) => {
  const id = req.params.classID;
  const userID = req.user.id;

  const requesterRole = await classService.checkIfUserIsInClass(userID, id);
  let newMember = false;

  if (!requesterRole && !req.user.isAdmin) {
    const cjc = req.query.cjc;
    if (typeof cjc === "undefined") {
      res
        .status(403)
        .json({ message: "You don't have permission to access this class!" });
      return;
    } else if (await classService.checkCJC(id, cjc)) {
      if (await classService.checkUserIsInWaitingList(userID, id)) {
        await classService.addUserToClass(userID, id, "teacher");
      } else {
        await classService.addUserToClass(userID, id, "student");
      }
      newMember = true;
    } else {
      console.log("notin!");
      res
        .status(403)
        .json({ message: "You don't have permission to access this class!" });
      return;
    }
  }

  // Check user from req token is the member of class ?

  Class.findByPk(id, {
    include: [
      // {
      //   model: User,
      //   as: "users",
      //   attributes: ["id", "username", "studentId"],
      //   through: {
      //     attributes: ["role"],
      //   },
      // },
      {
        model: Assignment,
        as: "assignments",
        attributes: ["id", "title", "point", "order", "finalize"],
      },
    ],
  })
    .then((data) => {
      if (data) {
        data.dataValues.requesterRole = req.user.isAdmin
          ? "admin"
          : requesterRole;
        data.dataValues.newMember = newMember;
        res.send(data);
      } else {
        res.status(404).send({
          message: `Cannot find Class with id=${id}.`,
        });
      }
    })
    .catch((err) => {
      res.status(500).send({
        message: "Error retrieving Class with id=" + id,
      });
    });
};

exports.getListUserInClass = async (req, res) => {
  const id = req.params.classID;
  Class.findByPk(id, {
    attributes: ["id"],
    include: [
      {
        model: User,
        as: "users",
        attributes: ["id", "username", "studentId"],
        through: {
          attributes: ["role"],
        },
      }
    ]
  }).then((data) => {
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).send({
        message: `Cannot find Class with id=${id}.`,
      });
    }
  })
  .catch((err) => {
    res.status(500).send({
      message: "Error retrieving Class with id=" + id,
    });
  });
};

exports.findAll = async (req, res) => {
  const className = req.query.className;

  // Get token
  // Convert token to currentUserId
  //console.log("curUser", req.user);
  const currentUserId = req.user.id;
  if (!currentUserId) {
    res.status(400).send({
      message: "Have you logged in yet?!",
    });
  }

  if (req.user.isAdmin) {
    const classes = await Class.findAll({
      attributes: ["id", "classname", "subject", "createdAt"],
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "username"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.send(classes);
    return;
  }

  const currentUser = await User.findOne({
    where: { id: currentUserId },
    attributes: ["id", "username"],
    include: [
      {
        model: Class,
        as: "classes",
        attributes: ["id", "classname", "subject"],
        through: {
          attributes: ["role"],
        },
      },
    ],
  });
  if (!currentUser) {
    res.status(400).send({
      message: "You don't have permission!",
    });
    return;
  }
  //console.log(JSON.stringify(currentUser.classes));
  res.send(currentUser.classes);
  // let userClass = await currentUser.getClasses({
  //   attributes: ["id", "classname", "subject"],
  // });
  // console.log("uc", JSON.stringify(userClass));

  // console.log(JSON.stringify(currentUser));
  // let classes = await Class.findAll({
  //   where: { ownerId: currentUserId },
  //   attributes: ["id", "classname", "subject"],
  // });
  // console.log("ss", JSON.stringify(classes));
};

// Add user to class (student)
exports.addUser = (req, res) => {
  const classId = req.params.classID;
  const newMember = {
    id: req.body.id,
    email: req.body.email,
    studentId: req.body.studentId,
  };
  //check current user is owner of this class ?

  Class.findByPk(classId)
    .then((foundClass) => {
      if (!foundClass) {
        res.status(500).send({
          message: "Error retrieving Class with id=" + classId,
        });
        console.log("Class not found!");
      }
      //find by email -> send mail

      //find by studentId -> add
      User.findOne({ where: { studentId: newMember.studentId } }).then(
        (member) => {
          if (!member) {
            console.log("Member not found!");
            res.status(500).send({
              message:
                "Error retrieving Member with studentId=" + newMember.studentId,
            });
          }

          // Role student
          foundClass.addUser(member, { through: { role: "student" } });
          console.log(
            `>> added member id=${member.id} to Class id=${foundClass.id}`
          );
          res.send(foundClass);
        }
      );
    })
    .catch((err) => {
      console.log(">> Error while adding Member to Class: ", err);
    });
};

exports.createAssignment = async (req, res) => {
  const userID = req.user.id; //req.user.id
  const classID = req.params.classID;
  const newAssignment = {
    title: req.body.title,
    point: req.body.point,
    order: req.body.order,
  };

  const result = await classService.addNewAssignment(
    userID,
    classID,
    newAssignment
  );
  if (result) {
    res.status(201).json(result);
  } else {
    res.status(500).json({ message: "Cannot create new assignment!" });
  }
};

exports.checkAvailableClass = async (req, res) => {
  const cjc = req.params.cjc;
  const userId = req.user.id;

  const classId = await classService.getClassIdByCJC(cjc);

  if (!classId) {
    res.status(404).json({ message: "Class doesn't exist!" });
    return;
  }

  const userIsInClass = await classService.checkIfUserIsInClass(
    userId,
    classId
  );
  if (!userIsInClass) {
    res.status(200).json({ classId, cjc });
  } else {
    res.status(404).json({ message: "You have been in this class already!" });
  }
};

exports.updateStudentList = async (req, res) => {
  const userID = req.user.id; //req.user.id
  const classID = req.params.classID;
  console.log("req.body", req.body);
  const studentList = req.body.studentList;
  const result = await classService.updateStudentList(classID, studentList);

  if (result) {
    res.status(200).json(result);
  } else {
    res.status(500).json({ message: "Cannot update student list!" });
  }
};

exports.getStudentList = async (req, res) => {
  const userID = req.user.id; //req.user.id
  const classID = req.params.classID;
  console.log("req.body", req.body);
  const result = await classService.getStudentList(classID);
  if (result) {
    res.status(200).json(result);
  } else {
    res.status(500).json({
      message: "Cannot get student list of class id: " + classID + "!",
    });
  }
};

exports.updateAssignment = async (req, res) => {
  // const classId = req.params.classID;
  const assignment = {
    id: req.body.id,
    title: req.body.title,
    point: req.body.point,
  };

  const result = await classService.updateAssignment(assignment);
  if (result) {
    res.status(200).json(result);
  } else {
    res.status(500).json({ message: "Cannot edit assignment!" });
  }
};

exports.deleteAssignment = async (req, res) => {
  const assignmentId = req.params.assignmentID;
  const classId = req.params.classID;

  const result = await classService.deleteAssignment(classId, assignmentId);
  if (result) {
    res.status(200).json({ message: "Delete successfully!" });
  } else {
    res.status(500).json({ message: "Cannot delete assignments!" });
  }
};

exports.getListAssignment = async (req, res) => {
  const classId = req.params.classID;

  const result = await classService.getListAssignment(classId);
  if (result) {
    res.status(200).json(result);
  } else {
    res.status(500).json({ message: "Cannot get list assignments of class!" });
  }
};

exports.updateAssignmentOrder = async (req, res) => {
  const classID = req.params.classID;
  const newListAssignment = req.body.listAssignment;

  const result = await classService.updateAssignmentOrder(
    classID,
    newListAssignment
  );
  if (result) {
    res
      .status(200)
      .json({ message: "Update order of assignments successfully!" });
  } else {
    res.status(500).json({ message: "Cannot Update order of assignments!" });
  }
};
