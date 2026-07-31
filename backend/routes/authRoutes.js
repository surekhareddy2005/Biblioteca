const express = require("express");

const router = express.Router();

const { createSuperAdmin ,login} = require("../controllers/authController");
const authorize = require("../middleware/roleMiddleware");

const protect = require("../middleware/authMiddleware");

router.post("/super-admin", createSuperAdmin);
router.post("/login",login);



//testing route for jwt
router.get("/profile", protect, (req, res) => {
    res.status(200).json({
        message: "Protected Route Accessed",
        user: req.user,
    });
});

//testing route for role
router.get(
    "/admin-test",
    protect,
    authorize("SUPER-ADMIN"),
    (req, res) => {
        res.status(200).json({
            message: "Welcome Super Admin",
        });
    }
);

module.exports = router;