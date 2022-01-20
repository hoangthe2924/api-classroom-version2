const db = require("../../models");
const Class = db.class;
const User = db.user;
const Assignment = db.assignment;
const AssignmetDetail = db.assignment_detail

module.exports = {
    async addNewAssignment(userID, classID, assignment) {
        try {
            const cls = await Class.findByPk(classID);
            const user = await User.findByPk(userID);

            if (cls && user) {
                const createdAssignment = await Assignment.create(assignment);
                createdAssignment.setClass(cls);
                createdAssignment.setCreator(user);
                return createdAssignment;
            } else {
                return false;
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    async updateAssignment(assignment) {
        try {
            const result = await Assignment.update(
                { title: assignment.title, point: assignment.point },
                { where: { id: assignment.id }, returning: true }
            );
            //console.log(result);
            if (result) {
                const newInfo = await Assignment.findByPk(assignment.id);
                return newInfo ? newInfo : false;
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    async deleteAssignment(classID, assignmentID) {
        try {
            const result = await Assignment.destroy({
                where: { id: assignmentID, classId: classID },
            });
            return result ? result : false;
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    async getListAssignment(classID) {
        try {
            return Assignment.findAll({
                where: { classId: classID },
                order: [["order", "ASC"]],
                attributes: ["id", "title", "point", "order"],
            });
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    async updateAssignmentOrder(classID, assignments) {
        try {
            for (let assignment of assignments) {
                await Assignment.update(
                    { order: assignment.order },
                    { where: { id: assignment.id, classId: classID } }
                );
            }
            return true;
        } catch (error) {
            console.log(error);
            return false;
        }
    },

    async saveFileInfo(creatorId, assignmentId, fileInfo) {
        try {
            const assginment_temp = await Assignment.findByPk(assignmentId)
            if (!assginment_temp)
                return false;
            const data = {
                ...fileInfo,
                "assignmentId": assignmentId,
                "creatorId": creatorId,
            }
            console.log(data);

            const createdAssignmentDetail = await AssignmetDetail.create(data);
            return createdAssignmentDetail;

        } catch (error) {
            console.log(error);
            return false;
        }

    }
}