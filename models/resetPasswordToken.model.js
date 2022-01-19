module.exports = (sequelize, Sequelize) => {
  const ResetPasswordToken = sequelize.define("resetPasswordToken", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      unique: true,
    },
    userId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      unique: true,
    },
    token: {
      type: Sequelize.STRING,
    },
  });

  return ResetPasswordToken;
};
