const assignmentService = require("./assignment.service");
const { SingletonDriveService } = require('../../googleDriveService');
const uploadFile = require("./uploadFile");

exports.updateAssignment = async (req, res) => {
    // const classId = req.params.classID;
    const assignment = {
        id: req.body.id,
        title: req.body.title,
        point: req.body.point,
    };

    const result = await assignmentService.updateAssignment(assignment);
    if (result) {
        res.status(200).json(result);
    } else {
        res.status(500).json({ message: "Cannot edit assignment!" });
    }
};

exports.deleteAssignment = async (req, res) => {
    const assignmentId = req.params.assignmentID;
    const classId = req.query.classID;

    const result = await assignmentService.deleteAssignment(classId, assignmentId);
    if (result) {
        res.status(200).json({ message: "Delete successfully!" });
    } else {
        res.status(500).json({ message: "Cannot delete assignments!" });
    }
};

exports.getListAssignment = async (req, res) => {
    const classId = req.query.classID;

    const result = await assignmentService.getListAssignment(classId);
    if (result) {
        res.status(200).json(result);
    } else {
        res.status(500).json({ message: "Cannot get list assignments of class!" });
    }
};


//development
exports.getListAssignmentForStudent = async (req, res) => {
    const classId = req.query.classId;
    const studentId = req.user.id; //req.user.id
    
    const result = await assignmentService.getListAssignmentForStudent(classId, studentId);
    if (result) {
        res.status(200).json(result);
    } else {
        res.status(500).json({ message: "Cannot get list assignments of class!" });
    }
};

exports.updateAssignmentOrder = async (req, res) => {
    const classID = req.body.classID;
    const newListAssignment = req.body.listAssignment;

    const result = await assignmentService.updateAssignmentOrder(
        classID,
        newListAssignment
    );
    if (result) {
        res
            .status(200)
            .json({ message: "Update order of assignments successfully!" });
    } else {
        res.status(500).json({ message: "Cannot Update order of assignments!" });
    }
};

exports.createAssignment = async (req, res) => {
    const userID = req.user.id; //req.user.id
    const classID = req.body.classID;
    const newAssignment = {
        title: req.body.title,
        point: req.body.point,
        order: req.body.order,
    };

    const result = await assignmentService.addNewAssignment(
        userID,
        classID,
        newAssignment
    );
    if (result) {
        res.status(201).json(result);
    } else {
        res.status(500).json({ message: "Cannot create new assignment!" });
    }
};

exports.postFileToGoogleDrive = async (req, res) => {
    const file = req.file;
    const fileName = file.originalname;
    console.log(file);
    if (!file) {
        return res.status(400).json({ message: 'Please upload a file' });
    }

    const assignmentId = req.params.assignmentID;
    const creatorId = req.user.id; //req.user.id
    const fileInfo = {
        "fileName": fileName,
    };

    // check is assignment exist
    const assignmentResult = await assignmentService.getAssignmentById(assignmentId);
    if (!assignmentResult)
        return res.status(500).json({ message: "Can not upload file!" });
    
    console.log(assignmentResult.dataValues)
    
    // save into assignment_detail
    const isSaveFileSuccess = await assignmentService.saveFileInfo(creatorId, assignmentId, fileInfo);
    if (!isSaveFileSuccess) {
        return res.status(500).json({ message: "Can not upload file!" });
    }

    const folderName = String(assignmentResult.class.dataValues.className) + '_' + String(assignmentResult.dataValues.title);
    const GoogleDriveService = SingletonDriveService.getInstance();

    await uploadFile(GoogleDriveService, folderName, fileName);

    return res.status(200)
        .json({ message: "Upload assignment successfully!" });
};
