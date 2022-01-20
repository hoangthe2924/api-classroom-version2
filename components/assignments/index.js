const express = require("express");
const router = express.Router();
const assignmentController = require("./assignment.controller");
const authTeacher = require("../../middleware/teacher.mdw");

router.post(
  "/",
  authTeacher,
  assignmentController.createAssignment
);

router.put(
  "/",
  authTeacher,
  assignmentController.updateAssignment
);

router.put(
  "/order",
  authTeacher,
  assignmentController.updateAssignmentOrder
);

router.delete(
  "/:assignmentID",
  authTeacher,
  assignmentController.deleteAssignment
);

router.get(
  "/",
  authTeacher,
  assignmentController.getListAssignment
);

module.exports = router;
