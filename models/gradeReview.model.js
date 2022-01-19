module.exports = (sequelize, Sequelize) => {
    const GradeReview = sequelize.define("gradeReview", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        unique: true,
      },
      expectedGrade: {
        type: Sequelize.FLOAT,
      },
      reviewMessage: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending',
      },
    });
  
    return GradeReview;
  };