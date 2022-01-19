module.exports = (sequelize, Sequelize) => {
    const Notification = sequelize.define("notification", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        unique: true,
      },
      type: {
        type: Sequelize.ENUM('finalize_grade','grade_review_reply','grade_review_final','grade_review_request'),
      },
    });
  
    return Notification;
  };
  