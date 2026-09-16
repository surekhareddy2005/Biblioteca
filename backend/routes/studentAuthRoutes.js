const express = require("express");

const router = express.Router();

const {
    loginStudent,
    registerStudent,
} = require("../controllers/studentAuthController");

router.post("/login", loginStudent);
router.post("/register", registerStudent);

module.exports = router;