const { admin } = require("../config/firebase");
const { getAuth } = require("firebase-admin/auth");


const handleLogin = async (req, res) => {
    return res.status(200).json({
        message: "Login handled by Firebase client SDK. Send token to backend via headers.",
    });
};



const handleRegister = async (req, res) => {
    const { user, pwd } = req.body;

    if (!user || !pwd) {
        return res.status(400).json({ message: "Username (email) and password required." });
    }

    try {
        const userRecord = await getAuth().createUser({
            email: user,
            password: pwd,
        });

        res.status(201).json({ message: `User ${userRecord.email} registered successfully.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error registering user." });
    }
};

module.exports = { handleLogin, handleRegister };
