const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");


const {
    reserveBook,  getAllReservations,
} = require("../controllers/reservationController");

router.post(
    "/",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    reserveBook
);

router.get(
    "/",
    protect,
    authorize("SUPER_ADMIN", "ADMIN"),
    getAllReservations
);



module.exports = router;