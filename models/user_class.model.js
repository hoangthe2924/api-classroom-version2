module.exports = (sequelize, Sequelize) => {
  const UserClass = sequelize.define("user_class", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      unique: true,
    },
    role: {
      type: Sequelize.STRING,
    },
  });

  return UserClass;
};
