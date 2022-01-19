const db = require("../../models");
const classModel = require("../../models/class.model");
const Class = db.class;
const User = db.user;
const Assignment = db.assignment;
const StudentFullname = db.studentFullname;
const UserClass = db.user_class;
const teacherWaitingList = db.teacherWaiting;
const Op = db.Sequelize.Op;

module.exports = {
  async getClassInfoByID(classID) {
    const res = await Class.findByPk(classID);
    return res;
  },

  async getClassList(user) {
    // Get token
    // Convert token to currentUserId
    //console.log("curUser", user);
    const currentUserId = user.id;
    if (!currentUserId) {
      return {
        status: 400,
        message: { message: "Have you logged in yet?!" },
      };
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
            attributes: [],
          },
        },
      ],
    });
    if (!currentUser) {
      return {
        status: 403,
        message: { message: "You don't have permission!" },
      };
    }
    //console.log(JSON.stringify(currentUser.classes));
    return {
      status: 200,
      message: currentUser.classes,
    };
  },

  async getClassIdByCJC(cjc) {
    const cls = await Class.findOne({ where: { cjc: cjc } });

    return cls === null ? null : cls.id;
  },

  async checkAlreadyEnrollment(email, classID) {
    const userID = this.getAccountIDByEmail(email);
    if (userID < 0) return false;
    const res = await UserClass.findOne({
      where: { userId: userID, classId: classID },
    }); //note
    if (res === null) return false;
    return true;
  },

  async addUserToClass(userID, classID, role) {
    try {
      const resCls = await Class.findByPk(classID);
      const resUser = await User.findByPk(userID);
      if (!resCls || !resUser) return 404;

      resCls.addUser(resUser, { through: { role: role } });
      return 201;
    } catch (error) {
      console.log(error);
      return 500;
    }
  },

  async checkIfUserIsInClass(userID, classID) {
    const res = await UserClass.findOne({
      where: { classId: classID, userId: userID },
    });
    return res === null ? false : res.role;
  },

  async checkCJC(classID, cjc) {
    const res = await Class.findOne({ where: { id: classID, cjc: cjc } });
    return res === null ? false : true;
  },

  async checkUserIsInWaitingList(userID, classID) {
    const user = await User.findByPk(userID);
    if (user !== null) {
      const listElement = await teacherWaitingList.findOne({
        where: { mail: user.email, classId: classID },
      });
      return listElement === null ? false : true;
    }
    return false;
  },

  async addToTeacherWaitingRoom(classID, emailList) {
    const cls = await Class.findByPk(classID);
    if (cls === null) {
      return false;
    }

    const array = emailList.map((email) => ({
      classid: classID,
      mail: email,
      classId: classID,
    }));
    teacherWaitingList.bulkCreate(array);
    return true;
  },

  async getAccountIDByEmail(email) {
    const res = await User.findOne({ where: { email: email } });
    if (res === null) return -1;
    return res.id;
  },

  async checkIfUserIsTeacher(userID, classID) {
    const res = await UserClass.findOne({
      where: { userId: userID, classId: classID, role: "teacher" },
    });
    return res !== null ? true : false;
  },

  async addNewAssignment(userID, classID, assignment) {
    try {
      const cls = await Class.findByPk(classID);
      const user = await User.findByPk(userID);

      if (cls && user) {
        const createdAssignment = await Assignment.create(assignment);
        createdAssignment.setClass(cls);
        createdAssignment.setCreator(user);
        return createdAssignment;
      } else {
        return false;
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  },

  async updateAssignment(assignment) {
    try {
      const result = await Assignment.update(
        { title: assignment.title, point: assignment.point },
        { where: { id: assignment.id }, returning: true }
      );
      //console.log(result);
      if (result) {
        const newInfo = await Assignment.findByPk(assignment.id);
        return newInfo ? newInfo : false;
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  },

  async deleteAssignment(classID, assignmentID) {
    try {
      const result = await Assignment.destroy({
        where: { id: assignmentID, classId: classID },
      });
      return result ? result : false;
    } catch (error) {
      console.log(error);
      return false;
    }
  },

  async getListAssignment(classID) {
    try {
      return Assignment.findAll({
        where: { classId: classID },
        order: [["order", "ASC"]],
        attributes: ["id", "title", "point", "order"],
      });
    } catch (error) {
      console.log(error);
      return false;
    }
  },

  async getStudentList(classID) {
    try {
      const actualStudentList = await StudentFullname.findAll({
        where: { classId: classID },
        attributes: ["id", "studentId", "fullName"],
      });

      const res = await Promise.all(
        actualStudentList.map(async (student) => {
          const extraInfo = await User.findOne({
            where: { studentId: student.studentId },
            attributes: ["username", "fullname"],
          });
          return {
            ...student.dataValues,
            fullName: { val: student.fullName, extra: extraInfo },
          };
        })
      );

      return res;
    } catch (error) {
      console.log(error);
      return false;
    }
  },

  async updateStudentList(classID, studentList) {
    try {
      const cls = await Class.findByPk(classID);
      for (let student of studentList) {
        const existedStudent = await StudentFullname.findOne({
          where: { classId: classID, studentId: student.studentId },
        });
        if (existedStudent) {
          // update
          existedStudent.update({ fullName: student.fullName });
        }
        // insert
        else {
          const newStudent = await StudentFullname.create({
            studentId: student.studentId,
            fullName: student.fullName,
            classId: classID,
          });
          // newStudent.setClass(cls);
        }
      }
      return StudentFullname.findAll({
        where: { classId: classID },
        attributes: ["id", "studentId", "fullName"],
      });
    } catch (error) {
      console.log(error);
      return false;
    }
  },

  async updateAssignmentOrder(classID, assignments) {
    try {
      for (let assignment of assignments) {
        await Assignment.update(
          { order: assignment.order },
          { where: { id: assignment.id, classId: classID } }
        );
      }
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  },
};
