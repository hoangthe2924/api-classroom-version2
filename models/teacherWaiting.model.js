module.exports = (sequelize, Sequelize) => {
  const TeacherWaiting = sequelize.define("teacherWaiting", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      unique: true,
    },
    mail: {
      type: Sequelize.STRING,
    },
  });

  return TeacherWaiting;
};
