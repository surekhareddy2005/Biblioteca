const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");


const {
    reserveBook,
} = require("../controllers/reservationController");

router.post(
    "/",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    reserveBook
);



module.exports = router;