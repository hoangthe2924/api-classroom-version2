const { user } = require("../../models");
const db = require("../../models");
const Assignment = db.assignment;
const User_class = db.user_class;
const GradeReview = db.gradeReview;

const Op = db.Sequelize.Op;
const gradeService = require("./grade.service");

exports.getStudentGrades = async (req, res) => {
  const assignmentID = req.params.asssignmentID;
  console.log("grading", req.body);
  const result = await gradeService.getStudentGrades(assignmentID);
  if (result) {
    res.status(200).json(result);
  } else {
    res
      .status(500)
      .json({
        message: "Cannot get student grades of assignment id: " + assignmentID + "!",
      });
  }
};

exports.updateStudentGrades = async (req, res) => {
  const assignmentID = req.params.asssignmentID;
  const classId = req.query.classID;

  console.log("grading", req.body);
  const studentGrades = req.body.studentList;
  const result = await gradeService.updateStudentGrades(assignmentID,classId, studentGrades);

  if (result) {
    res.status(200).json(result);
  } else {
    res.status(500).json({ message: "Cannot update student grades!" });
  }
};

exports.finalizeGrades = async (req, res) => {
  const assignmentID = req.params.asssignmentID;
  const classId = req.query.classID;
  const fromUser = req.user.id;

  console.log("grading", req.body);
  const result = await gradeService.finalizeGrades(assignmentID);
  if (result) {
    const toUserList = await User_class.findAll({
      where: { 
        classId: classId,
        role: "student",

       },
      attributes: ["userId"],
    });
    toUserList.forEach( async (toUser) => {
      await gradeService.createNotifications('finalize_grade',fromUser,toUser.userId,classId)
    });
    res.status(200).json(result);
  } else {
    res
      .status(500)
      .json({
        message: "Cannot get change finalize state of assignment id: " + assignmentID + "!",
      });
  }
};

exports.getStudentGradeDetail = async (req, res) => {
  const studentId = req.query.studentId;
  const classId = req.query.classId;

  const result = await gradeService.getStudentGradeDetail(studentId, classId);
  if(result === false){
    res.status(404).json({message: "Something went wrongg!"});
  }else if (result === null){
    res.status(500).json({message: "Resource is not available!"});
  }else{
    res.status(200).json(result);
  }
};

exports.createGradeReview = async (req, res) => {
  if(!req.user.studentId){
    res.status(203).json({message: "You haven't mapped this account with your studentID!"});
    return;
  }
  const userId = req.user.id;
  const assignmentId = req.params.assignmentID;
  const newGradeReview = {
    expectedGrade: req.body.expectedGrade,
    reviewMessage: req.body.message,
  };

  const result = await gradeService.createGradeReviewRequest(assignmentId, userId, newGradeReview);
  if(result === false){
    res.status(404).json({message: "Cannot create new grade review request!"});
  }else{
    const classId = await Assignment.findOne({
      where: {
        id: assignmentId
      },
      attributes: ["classId"],
    })

    const toUserList = await User_class.findAll({
      where: { 
        classId: classId.classId,
        role: "teacher",
       },
      attributes: ["userId"],
    });
    toUserList.forEach( async (toUser) => {
      await gradeService.createNotifications('grade_review_request',userId,toUser.userId,classId.classId)
    });
    res.status(201).json(result);
  }
};

exports.changeGradeReviewStatus = async (req, res) => {
  const gradeReviewId = req.body.gradeReviewId;
  const status = req.body.status;
  const assignmentId = req.params.assignmentID;
  const userId = req.user.id;
  const newGrade = req.body.newGrade;

  const result = await gradeService.changeGradeReviewRequestStatus(gradeReviewId, status, newGrade);
  if(!result){
    res.status(404).json({message: `${status} grade review fail!`});
  }else{
    const classId = await Assignment.findOne({
      where: {
        id: assignmentId
      },
      attributes: ["classId"],
    })

    const toUser = await GradeReview.findOne({
      where: { 
        id: gradeReviewId,
       },
      attributes: ["userId"],
    });
    console.log(toUser)
    if (toUser){
      await gradeService.createNotifications('grade_review_final',userId,toUser.userId,classId.classId)
    }
    res.status(201).json(result);
  }
};

exports.getGradeReviewDetail = async (req, res) => {
  const assignmentId = req.params.assignmentID;
  const studentId = req.query.studentID;

  const result = await gradeService.getGradeReviewDetail(studentId, assignmentId);
  if(result === false){
    res.status(404).json({message: "Something went wrongg!"});
  }else if (result === null){
    res.status(500).json({message: "Resource is not available!"});
  }else{
    res.status(200).json(result);
  }
};

exports.commentOnGradeReviewDetail = async (req, res) => {
  const userId = req.user.id;
  const gradeReviewId = req.body.gradeReviewId;
  const newGRcomment = {
    content: req.body.comment,
  };
  const assignmentId = req.params.assignmentID;

  console.log(gradeReviewId);

  const result = await gradeService.createGradeReviewComment(userId, gradeReviewId, newGRcomment);
  if(result === false){
    res.status(404).json({message: "Cannot create new grade review comment!"});
  }else{
    const classId = await Assignment.findOne({
      where: {
        id: assignmentId
      },
      attributes: ["classId"],
    })

    const toUser = await GradeReview.findOne({
      where: { 
        id: gradeReviewId,
       },
      attributes: ["userId"],
    });
    console.log(toUser)
    if (toUser && toUser.userId !== userId){
      await gradeService.createNotifications('grade_review_reply',userId,toUser.userId,classId.classId)
    }
    res.status(201).json(result);
  }
};

exports.getListGradeReview = async (req, res) => {
  const classId = req.query.classID;

  const result = await gradeService.getListGradeReview(classId);
  if(result === false){
    res.status(404).json({message: "Something went wrongg!"});
  }else if (result === null){
    res.status(500).json({message: "Resource is not available!"});
  }else{
    res.status(200).json(result);
  }
};

exports.getGradeReviewSummary = async (req, res) => {
  const studentId = req.query.studentID;
  const assignmentId = req.query.assignmentID;

  const result = await gradeService.getGradeReviewSummary(studentId, assignmentId);
  if(result === false){
    res.status(404).json({message: "Something went wrongg!"});
  }else if (result === null){
    res.status(500).json({message: "Resource is not available!"});
  }else{
    res.status(200).json(result);
  }
};

exports.getNotifications = async (req, res) => {
  const userId = req.user.id;

  const result = await gradeService.getNotifications(userId);
  if(result){
    res.status(200).json(result);
  }
  else{
    res.status(200).json({});
  }
};