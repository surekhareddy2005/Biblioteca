const express = require("express");

const router = express.Router();

require("../controllers/studentController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const {createStudent,getAllStudents,getStudentById,updateStudent,} =require("../controllers/studentController")


router.post(
    "/",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    createStudent
);

router.get(
    "/",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    getAllStudents
);

router.get(
    "/:id",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    getStudentById
);

router.put(
    "/:id",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    updateStudent
);

module.exports = router;