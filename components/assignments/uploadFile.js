const path = require("path");
const fs = require("fs");

async function uploadFile(googleDriveService, folderName, fileName){
    const finalPath = path.resolve(__dirname, '../../public/uploads/' + fileName);

    try {
        if (!fs.existsSync(finalPath)) {
            throw new Error('File not found!');
        }
        let folder = await googleDriveService.searchFolder(folderName);
        console.log(folder);

        if (!folder) {
            const result = await googleDriveService.createFolder(folderName);
            folder = result.data;
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
}

module.exports = uploadFile;