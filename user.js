var jwt = require('jsonwebtoken');
const db = require("./models");
const user_class = db.user_class;
const User = db.user;

const users = [];

const addUser = ({ socketId, token }) => {
    try {
        const jwtdecode = jwt.verify(token, process.env.JWT_SECRET)
        if (jwtdecode) {
            console.log(jwtdecode)
            const existingUser = users.find((user) => {
                if (user.username === jwtdecode.username)
                {
                    user.socketId = socketId;
                    return true;
                }
            });

            if (existingUser) {
                return
            }
            const user = {
                socketId,
                username: jwtdecode.username
            };
            users.push(user);
            console.log("socket users:");

            console.log(users);
            return { user };
        }
        return
    } catch (error) {
        console.log(error)
        return
    }
}

const removeUser = (socketId) => {
    const index = users.findIndex((user) => {
        return user.socketId === socketId
    });

    if (index !== -1) {
        users.splice(index, 1)[0];
        console.log("\x1b[33m", 'Remove user:');  //cyan
        console.log(users)
        return
    }
}

const findOnlineStudents = async (classId) => {
    const usersInClass = await user_class.findAll({
        where: { classId: classId, role: 'student' },
        attributes: ["userId"],
        include: [
            {
              model: User,
              attributes: ["id", "username"]
            }
          ],
      });
    var onlineUsers = [];
    if (usersInClass.length != 0) {
        users.forEach(user => {
            const check = usersInClass.some((classUser) => user.username === classUser.user.username)
            if (check)
            {
                console.log("***");
                console.log(check);
                console.log(user);
                onlineUsers.push(user);
            }
        });
    }
    console.log(onlineUsers);
    return onlineUsers;
}

const findOnlineTeachers = async (classId) => {
    const usersInClass = await user_class.findAll({
        where: { classId: classId, role: 'teacher' },
        attributes: ["userId"],
        include: [
            {
              model: User,
              attributes: ["id", "username"]
            }
          ],
      });
    var onlineUsers = [];
    if (usersInClass.length != 0) {
        users.forEach(user => {
            const check = usersInClass.some((classUser) => user.username === classUser.user.username)
            if (check)
            {
                console.log("***");
                console.log(check);
                console.log(user);
                onlineUsers.push(user);
            }
        });
    }
    console.log(onlineUsers);
    return onlineUsers;
}

const findOnlineStudentById = async (studentId) => {
    const userFound = await User.findOne({
        where: { studentId: studentId },
        attributes: ["username"],
      });
    var onlineUsers = [];
    if (userFound.length != 0) {
        users.forEach(user => {
            const check = (user.username === userFound.username)
            if (check)
            {
                console.log("***");
                console.log(check);
                console.log(user);
                onlineUsers.push(user);
            }
        });
    }
    console.log(onlineUsers);
    return onlineUsers;
}

module.exports = {
    addUser, removeUser,
    findOnlineStudents,
    findOnlineTeachers,
    findOnlineStudentById
};