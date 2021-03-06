const express = require("express");
const router = express.Router();
const assignmentController = require("./assignment.controller");
const authTeacher = require("../../middleware/teacher.mdw");
const authStudent = require("../../middleware/student.mdw");
const multer = require('multer');

// SET STORAGE
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

var upload = multer({ storage: storage })


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
router.get("/students",
    authStudent,
    assignmentController.getListAssignmentForStudent
)
router.post("/:assignmentID", 
    upload.single('file'), 
    assignmentController.postFileToGoogleDrive);

module.exports = router;
