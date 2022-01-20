module.exports = (sequelize, Sequelize) => {
    const assignment_detail = sequelize.define("assignment_details", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        unique: true,
      },
      fileName: {
        type: Sequelize.STRING,
      },
    });
  
    return assignment_detail;
  };
  