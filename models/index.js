const dbConfig = require("../config/db.config.js");
const bcrypt = require("bcryptjs");

const { Sequelize } = require("sequelize");
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  operatorsAliases: 0, //false
  logging: false,

  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.class = require("./class.model.js")(sequelize, Sequelize);
db.user = require("./user.model.js")(sequelize, Sequelize);
db.user_class = require("./user_class.model.js")(sequelize, Sequelize);
db.teacherWaiting = require("./teacherWaiting.model.js")(sequelize, Sequelize);
db.assignment = require("./assignment.model.js")(sequelize, Sequelize);
db.studentFullname = require("./studentFullname.model.js")(
  sequelize,
  Sequelize
);
db.grade = require("./grade.model.js")(sequelize, Sequelize);
db.gradeReview = require("./gradeReview.model.js")(sequelize, Sequelize);
db.commentGradeReview = require("./commentGradeDetail.model.js")(
  sequelize,
  Sequelize
);
db.notification = require("./notification.model.js")(sequelize, Sequelize);
db.resetPasswordToken = require("./resetPasswordToken.model.js")(
  sequelize,
  Sequelize
);

db.class.belongsTo(db.user, { foreignKey: "ownerId", as: "owner" });
db.user.hasMany(db.class, { foreignKey: "ownerId", as: "classesOwned" });

db.teacherWaiting.belongsTo(db.class, { foreignKey: "classId" });
db.class.hasMany(db.teacherWaiting, {
  foreignKey: "classId",
  as: "waitingTeachers",
});

db.assignment.belongsTo(db.class, { foreignKey: "classId" });
db.assignment.belongsTo(db.user, { foreignKey: "creatorId", as: "creator" });
db.class.hasMany(db.assignment, {
  foreignKey: "classId",
  as: "assignments",
});
db.user.hasMany(db.assignment, { foreignKey: "creatorId" });

db.studentFullname.belongsTo(db.class, { foreignKey: "classId" });
db.class.hasMany(db.studentFullname, {
  foreignKey: "classId",
  as: "studentList",
});

db.class.belongsToMany(db.user, {
  through: db.user_class,
  as: "users",
});
db.user.belongsToMany(db.class, {
  through: db.user_class,
  as: "classes",
});

db.user.hasMany(db.user_class);
db.user_class.belongsTo(db.user);
db.class.hasMany(db.user_class);
db.user_class.belongsTo(db.class);

db.grade.belongsTo(db.studentFullname, {
  foreignKey: "studentIdFk",
  as: "student",
});
db.studentFullname.hasMany(db.grade, {
  foreignKey: "studentIdFk",
});

db.grade.belongsTo(db.assignment, {
  foreignKey: "assignmentId",
  as: "assignment",
});
db.assignment.hasMany(db.grade, {
  foreignKey: "assignmentId",
});

db.studentFullname.belongsToMany(db.assignment, {
  through: db.grade,
  foreignKey: "studentIdFk",
  as: "assignments",
});

// db.assignment.belongsToMany(db.studentFullname, {
//   through: db.grade,
//   foreignKey: 'assignmentId',
//   as: "assignmentGrade",
// });

db.gradeReview.belongsTo(db.user, { foreignKey: "userId" });
db.user.hasMany(db.gradeReview, {
  foreignKey: "userId",
  as: "gradeReviewRequests",
});

db.gradeReview.belongsTo(db.assignment, { foreignKey: "assignmentId" });
db.assignment.hasMany(db.gradeReview, {
  foreignKey: "assignmentId",
  as: "gradeReviewList",
});

db.commentGradeReview.belongsTo(db.user, { foreignKey: "userId" });
db.user.hasMany(db.commentGradeReview, {
  foreignKey: "userId",
  as: "userCommentList",
});

db.commentGradeReview.belongsTo(db.gradeReview, {
  foreignKey: "gradeReviewId",
});
db.gradeReview.hasMany(db.commentGradeReview, {
  foreignKey: "gradeReviewId",
  as: "gdCommentList",
});

db.notification.belongsTo(db.user, { foreignKey: "from", as: "fromUser" });
db.user.hasMany(db.notification, { foreignKey: "from" });
db.notification.belongsTo(db.user, { foreignKey: "to", as: "toUser" });
db.user.hasMany(db.notification, { foreignKey: "to" });

db.notification.belongsTo(db.class, {
  foreignKey: "classId",
  as: "classNotification",
});
db.class.hasMany(db.notification, { foreignKey: "classId" });

db.user
  .findOrCreate({
    where: { username: "admin" },
    defaults: {
      email: process.env.ADMIN_MAIL,
      fullname: "Admin",
      isAdmin: true,
      password: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10),
    },
  })
  .then(function () {
    console.log("created!!");
  })
  .catch((err) => {
    console.log("error!!", err);
  });

module.exports = db;
