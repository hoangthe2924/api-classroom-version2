const express = require("express");
const router = express.Router();
const gradeController = require("./grade.controller");
const authTeacher = require("../../middleware/teacher.mdw");


router.get("/:asssignmentID/studentGrades", authTeacher, gradeController.getStudentGrades);

router.put("/:asssignmentID/studentGrades", authTeacher, gradeController.updateStudentGrades);

router.put("/:asssignmentID/finalize", authTeacher, gradeController.finalizeGrades);

router.get("/:assignmentID/review", gradeController.getGradeReviewDetail);

router.post("/:assignmentID/review", gradeController.createGradeReview);

router.put("/:assignmentID/review", gradeController.changeGradeReviewStatus);

router.post("/:assignmentID/review/comment", gradeController.commentOnGradeReviewDetail);

router.get("/studentGradeDetail", gradeController.getStudentGradeDetail);

router.get("/teacherGradeReviewList", authTeacher, gradeController.getListGradeReview);

router.get("/gradeReviewSummary", gradeController.getGradeReviewSummary);

router.get("/notifications", gradeController.getNotifications);

module.exports = router;
