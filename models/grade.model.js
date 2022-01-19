module.exports = (sequelize, Sequelize) => {
    const Grade = sequelize.define("grade", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        unique: true,
      },
      grade: {
        type: Sequelize.FLOAT,
      },
    });
  
    return Grade;
  };
  