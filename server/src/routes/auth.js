// routes for authentication
const excpress = require("express");
const router = excpress.Router();
const {handleLogin, handleRegister} = require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");

// //for testing only - can remove later - verify JWT middleware
// router.get("/auth", verifyJWT, (req, res) => {
//   res.json({ message: `Hello ${req.user}, your token is valid.` });
// });

// POST /auth
router.route('/')
.get(verifyJWT)
.post(handleLogin);


//Post /auth/register
// e.g 
router.post("/register", handleRegister);
// or
// router.route("/register")
//   .post(handleRegister);



module.exports = router;