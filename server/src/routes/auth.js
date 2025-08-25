// routes for authentication
const excpress = require("express");
const router = excpress.Router();
const authController = require("../controllers/authController");
const verifyJWT = require("../middleware/verifyJWT");

//for testing only - can remove later - verify JWT middleware
router.get("/auth", verifyJWT, (req, res) => {
  res.json({ message: `Hello ${req.user}, your token is valid.` });
});

router.route('/auth')
.get(verifyJWT)
.post(authController.handleLogin);

module.exports = router;