module.exports = (sequelize, Sequelize) => {
  const StudentFullname = sequelize.define("studentFullname", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      unique: true,
    },
    studentId: {
      type: Sequelize.INTEGER,
    },
    fullName: {
      type: Sequelize.STRING,
    },
  });

  return StudentFullname;
};
