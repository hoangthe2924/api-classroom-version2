const assignmentService = require("./assignment.service");
const { GoogleDriveService } = require('../../googleDriveService');
const path = require("path");
const fs = require("fs");


const driveClientId = process.env.GOOGLE_DRIVE_CLIENT_ID || '';
const driveClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || '';
const driveRedirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || '';
const driveRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '';


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
    const file = req.file
    const fileName = file.originalname;
    console.log(file);
    if (!file) {
        res.status(400).json({ message: 'Please upload a file'});
    }
    
    /** save to database
     */
    const assignmentId = req.params.assignmentID;
    const creatorId = req.user.id; //req.user.id
    
    // check is assignment exist
    // ...

    // save into assignment_detail
    // ...


    await (async () => {
        const googleDriveService = new GoogleDriveService(driveClientId, driveClientSecret, driveRedirectUri, driveRefreshToken);
        const finalPath = path.resolve(__dirname, '../../public/uploads/' + fileName);
        // console.log(finalPath);

        const folderName = 'Picture';
        try {
          if (!fs.existsSync(finalPath)) {
            throw new Error('File not found!');
        }
        let folder = await googleDriveService.searchFolder(folderName);
        console.log(folder);

        if(!folder){
          const res = await googleDriveService.createFolder(folderName);
          folder = res.data;
        }
        console.log(folder);

        await googleDriveService.saveFile(fileName, finalPath, 'application/octet-stream', folder.id);

        console.info('File uploaded successfully!');
        // Delete the file on the server
        fs.unlinkSync(finalPath);

        } catch (error) {
          console.log(error);
          res.status(500).json({ message: error });
        }
    })();

    res.status(200)
        .json({ message: "Upload assignment successfully!" });
};
