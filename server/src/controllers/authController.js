const usersDB = {
    users: require("../models/users.json"),
    setUsers: function (data) { this.users = data }
}


const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const fsPromises = require("fs").promises; // Before integrating with a real DB, we will use the file system to store users
const path = require("path");


const handleLogin = async (req, res) => {   
    const { user, pwd } = req.body;
    if (!user || !pwd) return res.status(400).json({ "message": "Username and password are required." });
    const foundUser = usersDB.users.find(person => person.username === user);
    if (!foundUser) return res.sendStatus(401); // Unauthorized
    // evaluate password
    const match = await bcrypt.compare(pwd, foundUser.password);
    if (match) {
         //Create JWTs

            const accessToken = jwt.sign( // payload, pass just username for security
                { "username": foundUser.username },
                process.env.ACCESS_TOKEN_SECRET, 
                { expiresIn: '30s' } // 30s for testing, 5m/15m in production
            );

            const refreshToken = jwt.sign( // payload, pass just username for security
                { "username": foundUser.username },
                process.env.REFRESH_TOKEN_SECRET, 
                { expiresIn: '1d' } // 1 day
            );
            // Saving refreshToken with current user in database
            const otherUsers = usersDB.users.filter(person => person.username !== foundUser.username); // For each person except the current user
            const currentUser = {...foundUser, refreshToken }; // Add refresh token to current user
            usersDB.setUsers([...otherUsers, currentUser]); // Update users array
            await fsPromises.writeFile( // Write to users.json file
                path.join(__dirname, '..', 'models', 'users.json'), 
                JSON.stringify(usersDB.users)
            );
            //Send tokens to user (accessToken) to front end, refreshToken as cookie, and accessToken as json
            //Store in memory, not secure in local storage
            // Cookie is sent with every request to the server // More secure with httpOnly
            res.cookie('jwt',refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // max age = 1 day (milliseconds) 
            res.json({ accessToken });
    } else {
        res.sendStatus(401);
    }
}

module.exports = { handleLogin };
