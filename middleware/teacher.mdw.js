const classService = require("../components/classes/class.service");

module.exports = async function authTeacher(req, res, next) {
  try {
    const classID = req.body.classID || req.params.classID || req.query.classID;
    const isInClassAsTeacher =
      (await classService.checkIfUserIsTeacher(req.user.id, classID)) ||
      req.user.isAdmin;

    if (!isInClassAsTeacher) {
      res
        .status(403)
        .json({ message: "You don't have permission to use this api!" });
    } else {
      next();
    }
  } catch (error) {
    res.status(404).json({ message: "Something went wrong!" });
  }
};
