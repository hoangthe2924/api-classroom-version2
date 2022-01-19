module.exports = (sequelize, Sequelize) => {
    const CommentGradeReview = sequelize.define("commentGradeReview", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        unique: true,
      },
      content: {
        type: Sequelize.STRING,
      },
    });
  
    return CommentGradeReview;
  };