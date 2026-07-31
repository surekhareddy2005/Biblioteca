const express = require("express");

const router = express.Router();

const { createSuperAdmin ,login} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

router.post("/super-admin", createSuperAdmin);
router.post("/login",login);



//testing route
router.get("/profile", protect, (req, res) => {
    res.status(200).json({
        message: "Protected Route Accessed",
        user: req.user,
    });
});

module.exports = router;