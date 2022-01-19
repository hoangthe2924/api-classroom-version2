const express = require("express");
const router = express.Router();
const classController = require("./class.controller");
const authTeacher = require("../../middleware/teacher.mdw");

router.get("/", (req, res) => classController.findAll(req, res));

router.post("/", (req, res) => classController.createNewClass(req, res));

router.post("/people/invite", authTeacher, classController.invitePeople);

router.post("/available/:cjc", classController.checkAvailableClass);

router.post(
  "/:classID/assignments",
  authTeacher,
  classController.createAssignment
);

router.put(
  "/:classID/assignments",
  authTeacher,
  classController.updateAssignment
);

router.put(
  "/:classID/assignments/order",
  authTeacher,
  classController.updateAssignmentOrder
);

router.delete(
  "/:classID/assignments/:assignmentID",
  authTeacher,
  classController.deleteAssignment
);

router.get(
  "/:classID/assignments",
  authTeacher,
  classController.getListAssignment
);

router.put(
  "/:classID/studentList",
  authTeacher,
  classController.updateStudentList
);

router.get(
  "/:classID/studentList",
  authTeacher,
  classController.getStudentList
);

router.post("/:classID/user", (req, res) => classController.addUser(req, res));

router.get("/:classID/users", (req, res) => classController.getListUserInClass(req, res));

router.get("/:classID", (req, res) => classController.getClassDetail(req, res));

module.exports = router;
