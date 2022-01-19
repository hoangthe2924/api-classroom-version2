module.exports = (sequelize, Sequelize) => {
  const Class = sequelize.define("class", {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
      unique: true,
    },
    className: {
      type: Sequelize.STRING,
    },
    subject: {
      type: Sequelize.STRING,
    },
    description: {
      type: Sequelize.STRING,
    },
    cjc: {
      type: Sequelize.STRING,
    },
  });

  return Class;
};
