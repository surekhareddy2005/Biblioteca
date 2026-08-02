const express = require("express");

const router = express.Router();

const {
    loginStudent,
} = require("../controllers/studentAuthController");

router.post("/login", loginStudent);

module.exports = router;